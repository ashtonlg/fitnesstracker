import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost, API_BASE } from "../api.js";

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
            const payload = {
                exercise_id: Number(exerciseId),
                weight_kg: Number(weight),
                reps: Number(reps),
            };
            if (!Number.isFinite(payload.weight_kg) || !Number.isFinite(payload.reps) || payload.reps <= 0) {
                throw new Error("Enter valid weight and reps");
            }

            const created = await apiPost(`/sessions/${sessionId}/entries`, payload);
            const total = selectedUsesBodyweight && bodyweight
                ? Number(payload.weight_kg) + Number(bodyweight)
                : Number(payload.weight_kg);
            setLog((prev) => [{ ...created, exercise_name: selectedName, total_kg: total }, ...prev]);
            setReps("");
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
            <h2 style={styles.h2}>Session #{sessionId}</h2>

            <div style={styles.field}>
                <label style={styles.label}>Bodyweight (kg)</label>
                <div style={styles.inline}>
                    <input
                        style={{ ...styles.input, flex: 1 }}
                        inputMode="decimal"
                        value={bodyweight}
                        onChange={(e) => setBodyweight(e.target.value)}
                        placeholder="optional"
                    />
                    <button style={styles.secondary} onClick={saveBodyweight}>Save</button>
                </div>
                {bodyweightSaved && <div style={styles.muted}>Saved.</div>}
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Exercise</label>
                <select style={styles.input} value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                    <option value="">Select…</option>
                    {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            <div style={styles.grid}>
                <div style={styles.field}>
                    <label style={styles.label}>Weight (kg)</label>
                    <input style={styles.input} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 80" />
                </div>
                <div style={styles.field}>
                    <label style={styles.label}>Reps</label>
                    <input style={styles.input} inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="e.g. 8" />
                </div>
            </div>
            {selectedUsesBodyweight && (
                <div style={styles.muted}>
                    Total load (includes bodyweight): {effectiveWeight || 0} kg
                </div>
            )}

            <button style={styles.primary} onClick={addSet}>Log set</button>

            <div style={styles.actions}>
                <button style={styles.secondary} onClick={() => nav("progress", { exerciseId })} disabled={!exerciseId}>
                    View progression
                </button>
                <button style={styles.danger} onClick={end}>End session</button>
            </div>

            <h3 style={styles.h3}>Logged (latest first)</h3>
            <div style={styles.log}>
                {log.map((x) => (
                    <div key={x.id} style={styles.logRow}>
                        <div style={{ fontWeight: 700 }}>{x.exercise_name}</div>
                        <div style={styles.muted}>
                            {x.total_kg && x.total_kg !== x.weight_kg
                                ? `${x.weight_kg} kg + BW = ${x.total_kg} kg × ${x.reps}`
                                : `${x.weight_kg} kg × ${x.reps}`
                            }
                        </div>
                    </div>
                ))}
                {log.length === 0 && <div style={styles.muted}>No sets logged yet.</div>}
            </div>

            {err && <div style={styles.err}>{err}</div>}
        </div>
    );
}

const styles = {
    card: { border: "1px solid #e6e6e6", borderRadius: 14, padding: 12, background: "#fff" },
    h2: { margin: "0 0 10px 0" },
    h3: { margin: "14px 0 8px 0" },
    field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
    inline: { display: "flex", gap: 8, alignItems: "center" },
    label: { fontSize: 12, color: "#333" },
    input: { padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    primary: { padding: "12px 12px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700, width: "100%" },
    actions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 },
    secondary: { padding: "12px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 700 },
    danger: { padding: "12px 12px", borderRadius: 12, border: "1px solid #b00020", background: "#fff", color: "#b00020", fontWeight: 800 },
    log: { display: "flex", flexDirection: "column", gap: 8 },
    logRow: { padding: "10px 12px", borderRadius: 12, border: "1px solid #eee", background: "#fafafa" },
    muted: { color: "#666", fontSize: 13 },
    err: { marginTop: 10, color: "#b00020", fontSize: 13 }
};
