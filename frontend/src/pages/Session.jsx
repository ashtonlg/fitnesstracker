import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiGet, apiPost, API_BASE } from "../api.js";
import { COLORS } from "../theme.js";

export default function Session({ nav, sessionId }) {
    const [exercises, setExercises] = useState([]);
    const [exerciseId, setExerciseId] = useState("");
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [log, setLog] = useState([]);
    const [err, setErr] = useState("");
    const [bodyweight, setBodyweight] = useState("");
    const [bodyweightSaved, setBodyweightSaved] = useState(false);
    const endedRef = useRef(false);

    useEffect(() => {
        apiGet("/exercises").then(setExercises).catch((e) => setErr(String(e)));
    }, []);

    useEffect(() => {
        if (!sessionId) return;
        apiGet(`/sessions/${sessionId}`)
            .then((s) => {
                if (s.bodyweight_kg !== null && s.bodyweight_kg !== undefined) {
                    setBodyweight(String(s.bodyweight_kg));
                }
            })
            .catch(() => {});
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;
        loadEntries();
    }, [sessionId]);

    async function loadEntries() {
        try {
            const rows = await apiGet(`/sessions/${sessionId}/entries`);
            setLog(rows);
        } catch (e) {
            setErr(String(e));
        }
    }

    useEffect(() => {
        if (!sessionId) return;

        const endViaBeacon = () => {
            if (endedRef.current) return;
            endedRef.current = true;
            const url = `${API_BASE}/sessions/${sessionId}/end`;
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    keepalive: true,
                }).catch(() => {});
            }
        };

        const onBeforeUnload = () => endViaBeacon();
        const onPageHide = () => endViaBeacon();

        window.addEventListener("beforeunload", onBeforeUnload);
        window.addEventListener("pagehide", onPageHide);

        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            window.removeEventListener("pagehide", onPageHide);
        };
    }, [sessionId]);

    const selectedName = useMemo(() => {
        const ex = exercises.find((x) => String(x.id) === String(exerciseId));
        return ex ? ex.name : "";
    }, [exercises, exerciseId]);

    const selectedUsesBodyweight = useMemo(() => {
        const ex = exercises.find((x) => String(x.id) === String(exerciseId));
        return ex ? !!ex.uses_bodyweight : false;
    }, [exercises, exerciseId]);

    const effectiveWeight = useMemo(() => {
        const w = Number(weight || 0);
        const bw = Number(bodyweight || 0);
        if (selectedUsesBodyweight && bw) return w + bw;
        return w;
    }, [weight, bodyweight, selectedUsesBodyweight]);

    async function saveBodyweight() {
        setErr("");
        try {
            if (!bodyweight) throw new Error("Enter bodyweight");
            await apiPost(`/sessions/${sessionId}/bodyweight`, { bodyweight_kg: Number(bodyweight) });
            setBodyweightSaved(true);
            setTimeout(() => setBodyweightSaved(false), 1200);
        } catch (e) {
            setErr(String(e));
        }
    }

    async function addSet() {
        setErr("");
        try {
            if (!exerciseId) throw new Error("Select an exercise");
            if (weight === "" || reps === "") throw new Error("Enter weight and reps");
            if (selectedUsesBodyweight && !bodyweight) throw new Error("Enter bodyweight for bodyweight exercises");
            const payload = {
                exercise_id: Number(exerciseId),
                weight_kg: Number(weight),
                reps: Number(reps),
            };
            if (!Number.isFinite(payload.weight_kg) || !Number.isFinite(payload.reps) || payload.reps <= 0) {
                throw new Error("Enter valid weight and reps");
            }

            await apiPost(`/sessions/${sessionId}/entries`, payload);
            await loadEntries();
            setReps("");
        } catch (e) {
            setErr(String(e));
        }
    }

    async function deleteEntry(id) {
        if (!confirm("Delete this set?")) return;
        setErr("");
        try {
            await apiDelete(`/entries/${id}`);
            setLog((prev) => prev.filter((x) => x.id !== id));
        } catch (e) {
            setErr(String(e));
        }
    }

    async function deleteWorkout() {
        if (!confirm("Delete this workout and all its logs?")) return;
        setErr("");
        try {
            await apiDelete(`/sessions/${sessionId}`);
            endedRef.current = true;
            nav("home");
        } catch (e) {
            setErr(String(e));
        }
    }

    async function end() {
        setErr("");
        try {
            await apiPost(`/sessions/${sessionId}/end`);
            endedRef.current = true;
            nav("home");
        } catch (e) {
            setErr(String(e));
        }
    }

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <h2 style={styles.h2}>Session #{sessionId}</h2>
                <button style={styles.endBtn} onClick={end}>End</button>
            </div>

            <div style={styles.section}>
                <label style={styles.label}>Bodyweight (kg)</label>
                <div style={styles.inline}>
                    <input
                        style={{ ...styles.input, flex: 1 }}
                        inputMode="decimal"
                        value={bodyweight}
                        onChange={(e) => setBodyweight(e.target.value)}
                        placeholder="Optional"
                    />
                    <button style={styles.secondary} onClick={saveBodyweight}>Save</button>
                </div>
                {bodyweightSaved && <span style={styles.saved}>Saved</span>}
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
                <label style={styles.label}>Exercise</label>
                <select style={styles.select} value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                    <option value="">Select exercise…</option>
                    {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            <div style={styles.grid}>
                <div style={styles.section}>
                    <label style={styles.label}>Weight (kg)</label>
                    <input style={styles.input} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
                </div>
                <div style={styles.section}>
                    <label style={styles.label}>Reps</label>
                    <input style={styles.input} inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="0" />
                </div>
            </div>

            {selectedUsesBodyweight && (
                <div style={styles.hint}>
                    Total load: {effectiveWeight || 0} kg (includes bodyweight)
                </div>
            )}

            <button style={styles.primary} onClick={addSet}>Log Set</button>

            <div style={styles.divider} />

            <h3 style={styles.h3}>Logged Sets</h3>
            <div style={styles.log}>
                {log.map((x) => (
                    <div key={x.id} style={styles.logRow}>
                        <div>
                            <div style={styles.logExercise}>{x.exercise_name}</div>
                            <div style={styles.logDetail}>
                                {x.total_kg && x.total_kg !== x.weight_kg
                                    ? `${x.weight_kg} kg + BW = ${x.total_kg} kg × ${x.reps}`
                                    : `${x.weight_kg} kg × ${x.reps}`
                                }
                            </div>
                        </div>
                        <button style={styles.deleteMini} onClick={() => deleteEntry(x.id)}>Delete</button>
                    </div>
                ))}
                {log.length === 0 && <div style={styles.empty}>No sets logged yet</div>}
            </div>

            <div style={styles.divider} />

            <div style={styles.actions}>
                <button style={styles.tertiary} onClick={() => nav("progress", { exerciseId })} disabled={!exerciseId}>
                    View Progress
                </button>
                <button style={styles.danger} onClick={deleteWorkout}>Delete Workout</button>
            </div>

            {err && <div style={styles.err}>{err}</div>}
        </div>
    );
}

const styles = {
    card: {
        borderRadius: 20,
        padding: 20,
        background: COLORS.card,
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    h2: {
        margin: 0,
        fontSize: 20,
        fontWeight: 700,
        color: COLORS.text,
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    divider: {
        height: 1,
        background: COLORS.border,
        margin: "16px 0",
    },
    label: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    input: {
        padding: "12px 16px",
        borderRadius: 9999,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.bg,
        fontSize: 15,
        outline: "none",
    },
    select: {
        padding: "12px 16px",
        borderRadius: 9999,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.bg,
        fontSize: 15,
        outline: "none",
        cursor: "pointer",
    },
    inline: {
        display: "flex",
        gap: 10,
        alignItems: "center",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginTop: 12,
    },
    primary: {
        padding: "14px 24px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.mustard,
        color: "#fff",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
        marginTop: 16,
    },
    secondary: {
        padding: "10px 18px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.bg,
        color: COLORS.text,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
    },
    tertiary: {
        padding: "10px 18px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.bg,
        color: COLORS.textMuted,
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
    },
    endBtn: {
        padding: "8px 16px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.mustardLight,
        color: COLORS.mustardDark,
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
    },
    danger: {
        padding: "10px 18px",
        borderRadius: 9999,
        border: "none",
        background: "transparent",
        color: COLORS.danger,
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
    },
    hint: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    saved: {
        fontSize: 13,
        color: COLORS.mustardDark,
        fontWeight: 500,
    },
    h3: {
        margin: 0,
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    log: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    logRow: {
        padding: "14px 16px",
        borderRadius: 16,
        background: COLORS.bg,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    logExercise: {
        fontWeight: 600,
        fontSize: 15,
        color: COLORS.text,
    },
    logDetail: {
        color: COLORS.textMuted,
        fontSize: 13,
        marginTop: 2,
    },
    deleteMini: {
        padding: "6px 12px",
        borderRadius: 9999,
        border: "none",
        background: "transparent",
        color: COLORS.danger,
        fontWeight: 500,
        fontSize: 13,
        cursor: "pointer",
    },
    empty: {
        color: COLORS.textMuted,
        fontSize: 14,
        textAlign: "center",
        padding: "20px 0",
    },
    actions: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    err: {
        marginTop: 12,
        color: COLORS.danger,
        fontSize: 14,
        textAlign: "center",
        padding: "12px 16px",
        background: "#fdf2f2",
        borderRadius: 12,
    },
};
