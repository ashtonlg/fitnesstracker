import React, { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../api.js";

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
            <h2 style={styles.h2}>Goals</h2>

            <div style={styles.summaryCard}>
                <div>
                    <div style={styles.summaryTitle}>Chin-up counter</div>
                    <div style={styles.muted}>
                        {summary ? summary.chinup_reps : 0} reps · {summary ? summary.chinup_sets : 0} sets
                    </div>
                </div>
                <div>
                    <div style={styles.summaryTitle}>Avg load per set</div>
                    <div style={styles.muted}>
                        {summary ? summary.avg_load_kg.toFixed(1) : "0.0"} kg
                    </div>
                </div>
            </div>

            <h3 style={styles.h3}>Add goal</h3>
            <div style={styles.field}>
                <label style={styles.label}>Type</label>
                <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="pr">PR (exercise, weight, reps)</option>
                    <option value="frequency">Frequency (sessions/week)</option>
                </select>
            </div>

            {type === "pr" ? (
                <>
                    <div style={styles.field}>
                        <label style={styles.label}>Exercise</label>
                        <select style={styles.input} value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                            <option value="">Select…</option>
                            {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div style={styles.grid}>
                        <div style={styles.field}>
                            <label style={styles.label}>Target weight (kg)</label>
                            <input style={styles.input} inputMode="decimal" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Target reps</label>
                            <input style={styles.input} inputMode="numeric" value={targetReps} onChange={(e) => setTargetReps(e.target.value)} />
                        </div>
                    </div>
                </>
            ) : (
                <div style={styles.field}>
                    <label style={styles.label}>Sessions per week</label>
                    <input style={styles.input} inputMode="numeric" value={targetFreq} onChange={(e) => setTargetFreq(e.target.value)} />
                </div>
            )}

            <button style={styles.primary} onClick={addGoal}>Add goal</button>

            <h3 style={styles.h3}>Your goals</h3>
            <div style={styles.list}>
                {goals.map((g) => (
                    <div key={g.id} style={styles.goalRow}>
                        <div>
                            <div style={styles.goalTitle}>
                                {g.type === "pr"
                                    ? `${exerciseName(exercises, g.exercise_id)} PR`
                                    : "Frequency"}
                            </div>
                            {g.type === "pr" ? (
                                <div style={styles.muted}>
                                    Target: {g.target_weight_kg} kg × {g.target_reps}
                                </div>
                            ) : (
                                <div style={styles.muted}>
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
                {goals.length === 0 && <div style={styles.muted}>No goals yet.</div>}
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
    if (!progress || !progress.best) return <span style={styles.muted}>No sets yet.</span>;
    const pct = Math.round(progress.percent * 100);
    return (
        <div>
            <div style={styles.muted}>{pct}% • Best {progress.best.total_kg.toFixed(1)} kg × {progress.best.reps}</div>
            {!progress.hasMatch && (
                <div style={styles.mutedSmall}>No sets at {goal.target_reps}+ reps yet.</div>
            )}
        </div>
    );
}

function FrequencyProgress({ count, goal }) {
    const target = Number(goal.target_sessions_per_week || 0);
    const pct = target > 0 ? Math.min(1, count / target) : 0;
    return (
        <div style={styles.muted}>
            {Math.round(pct * 100)}% • {count} of {target} sessions (last 7 days)
        </div>
    );
}

const styles = {
    card: { border: "1px solid #e6e6e6", borderRadius: 14, padding: 12, background: "#fff" },
    h2: { margin: "0 0 10px 0" },
    h3: { margin: "14px 0 8px 0" },
    field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
    label: { fontSize: 12, color: "#333" },
    input: { padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    primary: { padding: "12px 12px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700, width: "100%" },
    list: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
    goalRow: { padding: "10px 12px", borderRadius: 12, border: "1px solid #eee", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
    goalTitle: { fontWeight: 800 },
    progress: { marginTop: 6 },
    deleteMini: { padding: "6px 8px", borderRadius: 8, border: "1px solid #b00020", background: "#fff", color: "#b00020", fontWeight: 700 },
    summaryCard: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid #eee", background: "#fafafa" },
    summaryTitle: { fontWeight: 800 },
    muted: { color: "#666", fontSize: 13 },
    mutedSmall: { color: "#666", fontSize: 12 },
    err: { marginTop: 10, color: "#b00020", fontSize: 13 }
};
