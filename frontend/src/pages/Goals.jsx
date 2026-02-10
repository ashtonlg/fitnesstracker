import React, { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../api.js";
import { COLORS } from "../theme.js";

export default function Goals() {
    const [exercises, setExercises] = useState([]);
    const [goals, setGoals] = useState([]);
    const [summary, setSummary] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [err, setErr] = useState("");

    const [type, setType] = useState("pr");
    const [exerciseId, setExerciseId] = useState("");
    const [targetWeight, setTargetWeight] = useState("");
    const [targetReps, setTargetReps] = useState("");
    const [targetFreq, setTargetFreq] = useState("");

    const [prProgress, setPrProgress] = useState({});

    useEffect(() => {
        apiGet("/exercises").then(setExercises).catch((e) => setErr(String(e)));
        loadGoals();
        loadSummary();
        loadSessions();
    }, []);

    useEffect(() => {
        const run = async () => {
            const next = {};
            const prGoals = goals.filter((g) => g.type === "pr" && g.exercise_id);
            for (const g of prGoals) {
                try {
                    const points = await apiGet(`/progress/exercise/${g.exercise_id}`);
                    next[g.id] = computePrProgress(points, g);
                } catch (e) {
                    next[g.id] = { percent: 0, best: null, hasMatch: false };
                }
            }
            setPrProgress(next);
        };
        if (goals.length) run();
    }, [goals]);

    async function loadGoals() {
        try {
            const rows = await apiGet("/goals");
            setGoals(rows);
        } catch (e) {
            setErr(String(e));
        }
    }

    async function loadSummary() {
        try {
            const data = await apiGet("/goals/summary");
            setSummary(data);
        } catch (e) {
            setErr(String(e));
        }
    }

    async function loadSessions() {
        try {
            const rows = await apiGet("/sessions");
            setSessions(rows);
        } catch (e) {
            setErr(String(e));
        }
    }

    async function addGoal() {
        setErr("");
        try {
            if (type === "pr") {
                if (!exerciseId) throw new Error("Select an exercise");
                if (!targetWeight || !targetReps) throw new Error("Enter target weight and reps");
                const payload = {
                    type: "pr",
                    exercise_id: Number(exerciseId),
                    target_weight_kg: Number(targetWeight),
                    target_reps: Number(targetReps),
                };
                if (!Number.isFinite(payload.target_weight_kg) || payload.target_weight_kg <= 0) {
                    throw new Error("Enter a valid target weight");
                }
                if (!Number.isFinite(payload.target_reps) || payload.target_reps <= 0) {
                    throw new Error("Enter valid target reps");
                }
                await apiPost("/goals", payload);
            } else {
                if (!targetFreq) throw new Error("Enter sessions per week");
                const payload = {
                    type: "frequency",
                    target_sessions_per_week: Number(targetFreq),
                };
                if (!Number.isFinite(payload.target_sessions_per_week) || payload.target_sessions_per_week <= 0) {
                    throw new Error("Enter a valid weekly frequency");
                }
                await apiPost("/goals", payload);
            }
            setExerciseId("");
            setTargetWeight("");
            setTargetReps("");
            setTargetFreq("");
            await loadGoals();
        } catch (e) {
            setErr(String(e));
        }
    }

    async function deleteGoal(id) {
        if (!confirm("Delete this goal?")) return;
        setErr("");
        try {
            await apiDelete(`/goals/${id}`);
            loadGoals();
        } catch (e) {
            setErr(String(e));
        }
    }

    const weeklyCount = useMemo(() => countLast7Days(sessions), [sessions]);

    return (
        <div style={styles.card}>
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statValue}>{summary ? summary.chinup_reps : 0}</div>
                    <div style={styles.statLabel}>Chin-up Reps</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statValue}>{summary ? summary.avg_load_kg.toFixed(1) : "0.0"}</div>
                    <div style={styles.statLabel}>Avg Load (kg)</div>
                </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
                <h3 style={styles.h3}>New Goal</h3>
                <div style={styles.typeSelect}>
                    <button
                        style={type === "pr" ? styles.typeBtnActive : styles.typeBtn}
                        onClick={() => setType("pr")}
                    >
                        PR Goal
                    </button>
                    <button
                        style={type === "frequency" ? styles.typeBtnActive : styles.typeBtn}
                        onClick={() => setType("frequency")}
                    >
                        Frequency
                    </button>
                </div>

                {type === "pr" ? (
                    <>
                        <div style={styles.section}>
                            <label style={styles.label}>Exercise</label>
                            <select style={styles.select} value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                                <option value="">Select exercise…</option>
                                {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div style={styles.grid}>
                            <div style={styles.section}>
                                <label style={styles.label}>Target Weight (kg)</label>
                                <input style={styles.input} inputMode="decimal" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="0" />
                            </div>
                            <div style={styles.section}>
                                <label style={styles.label}>Target Reps</label>
                                <input style={styles.input} inputMode="numeric" value={targetReps} onChange={(e) => setTargetReps(e.target.value)} placeholder="0" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={styles.section}>
                        <label style={styles.label}>Sessions per Week</label>
                        <input style={styles.input} inputMode="numeric" value={targetFreq} onChange={(e) => setTargetFreq(e.target.value)} placeholder="e.g. 4" />
                    </div>
                )}

                <button style={styles.primary} onClick={addGoal}>Add Goal</button>
            </div>

            <div style={styles.divider} />

            <h3 style={styles.h3}>Your Goals</h3>
            <div style={styles.list}>
                {goals.map((g) => (
                    <div key={g.id} style={styles.goalRow}>
                        <div style={styles.goalContent}>
                            <div style={styles.goalTitle}>
                                {g.type === "pr"
                                    ? `${exerciseName(exercises, g.exercise_id)} PR`
                                    : "Weekly Frequency"
                                }
                            </div>
                            {g.type === "pr" ? (
                                <div style={styles.goalTarget}>
                                    Target: {g.target_weight_kg} kg × {g.target_reps}
                                </div>
                            ) : (
                                <div style={styles.goalTarget}>
                                    Target: {g.target_sessions_per_week} sessions/week
                                </div>
                            )}
                            <div style={styles.progress}>
                                {g.type === "pr" ? (
                                    <PrProgress progress={prProgress[g.id]} goal={g} />
                                ) : (
                                    <FrequencyProgress count={weeklyCount} goal={g} />
                                )}
                            </div>
                        </div>
                        <button style={styles.deleteMini} onClick={() => deleteGoal(g.id)}>Delete</button>
                    </div>
                ))}
                {goals.length === 0 && <div style={styles.empty}>No goals yet</div>}
            </div>

            {err && <div style={styles.err}>{err}</div>}
        </div>
    );
}

function computePrProgress(points, goal) {
    if (!points || points.length === 0) {
        return { percent: 0, best: null, hasMatch: false };
    }
    const targetWeight = Number(goal.target_weight_kg || 0);
    const targetReps = Number(goal.target_reps || 0);
    const eligible = points.filter((p) => p.reps >= targetReps);
    const best = (eligible.length ? eligible : points).reduce((a, b) => (b.total_kg > a.total_kg ? b : a), points[0]);
    const percent = targetWeight > 0 ? Math.min(1, best.total_kg / targetWeight) : 0;
    return { percent, best, hasMatch: eligible.length > 0 };
}

function countLast7Days(sessions) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return sessions.filter((s) => new Date(s.started_at) >= cutoff).length;
}

function exerciseName(exercises, id) {
    const ex = exercises.find((e) => String(e.id) === String(id));
    return ex ? ex.name : "Exercise";
}

function PrProgress({ progress, goal }) {
    if (!progress || !progress.best) return <span style={styles.muted}>No sets yet</span>;
    const pct = Math.round(progress.percent * 100);
    return (
        <div>
            <div style={styles.progressText}>{pct}% • Best {progress.best.total_kg.toFixed(1)} kg × {progress.best.reps}</div>
            {!progress.hasMatch && (
                <div style={styles.hint}>No sets at {goal.target_reps}+ reps yet</div>
            )}
        </div>
    );
}

function FrequencyProgress({ count, goal }) {
    const target = Number(goal.target_sessions_per_week || 0);
    const pct = target > 0 ? Math.min(1, count / target) : 0;
    return (
        <div style={styles.progressText}>
            {Math.round(pct * 100)}% • {count} of {target} sessions (last 7 days)
        </div>
    );
}

const styles = {
    card: {
        borderRadius: 20,
        padding: 20,
        background: COLORS.card,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
    },
    statCard: {
        padding: "16px",
        borderRadius: 16,
        background: COLORS.bg,
        textAlign: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: 700,
        color: COLORS.mustard,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    divider: {
        height: 1,
        background: COLORS.border,
        margin: "20px 0",
    },
    h3: {
        margin: 0,
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    typeSelect: {
        display: "flex",
        gap: 8,
    },
    typeBtn: {
        flex: 1,
        padding: "10px 16px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.bg,
        color: COLORS.textMuted,
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
    },
    typeBtnActive: {
        flex: 1,
        padding: "10px 16px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.mustardLight,
        color: COLORS.mustardDark,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
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
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
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
        marginTop: 4,
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    goalRow: {
        padding: "16px",
        borderRadius: 16,
        background: COLORS.bg,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    goalContent: {
        flex: 1,
    },
    goalTitle: {
        fontWeight: 600,
        fontSize: 15,
        color: COLORS.text,
    },
    goalTarget: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    progress: {
        marginTop: 8,
    },
    progressText: {
        fontSize: 13,
        color: COLORS.mustardDark,
        fontWeight: 500,
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
    muted: {
        color: COLORS.textMuted,
        fontSize: 13,
    },
    hint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    empty: {
        color: COLORS.textMuted,
        fontSize: 14,
        textAlign: "center",
        padding: "20px 0",
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
