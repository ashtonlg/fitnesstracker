import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api.js";

export default function Progress({ nav, exerciseId }) {
    const [exercises, setExercises] = useState([]);
    const [points, setPoints] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        apiGet("/exercises").then(setExercises).catch((e) => setErr(String(e)));
    }, []);

    useEffect(() => {
        if (!exerciseId) return;
        apiGet(`/progress/exercise/${exerciseId}`).then(setPoints).catch((e) => setErr(String(e)));
    }, [exerciseId]);

    const exName = useMemo(() => {
        const ex = exercises.find((x) => String(x.id) === String(exerciseId));
        return ex ? ex.name : "Select an exercise";
    }, [exercises, exerciseId]);

    const best = useMemo(() => {
        if (!points.length) return null;
        return points.reduce((a, b) => (b.e1rm > a.e1rm ? b : a), points[0]);
    }, [points]);

    return (
        <div style={styles.card}>
            <h2 style={styles.h2}>Progress</h2>

            <div style={styles.field}>
                <label style={styles.label}>Exercise</label>
                <select
                    style={styles.input}
                    value={exerciseId ?? ""}
                    onChange={(e) => nav("progress", { exerciseId: e.target.value })}
                >
                    <option value="">Select…</option>
                    {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            <div style={styles.summary}>
                <div style={styles.summaryTitle}>{exName}</div>
                {best ? (
                    <div style={styles.muted}>
                        Best (e1RM): {best.e1rm.toFixed(1)} kg — {best.weight_kg}×{best.reps}
                    </div>
                ) : (
                    <div style={styles.muted}>No data yet.</div>
                )}
            </div>

            <h3 style={styles.h3}>History</h3>
            <div style={styles.table}>
                {points.slice().reverse().map((p, idx) => (
                    <div key={idx} style={styles.row}>
                        <div style={styles.date}>{new Date(p.date).toLocaleString()}</div>
                        <div style={styles.cell}>
                            {p.total_kg && p.total_kg !== p.weight_kg
                                ? `${p.weight_kg} kg + BW = ${p.total_kg} kg × ${p.reps}`
                                : `${p.weight_kg} kg × ${p.reps}`
                            }
                        </div>
                        <div style={styles.cell}>e1RM {p.e1rm.toFixed(1)}</div>
                    </div>
                ))}
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
    label: { fontSize: 12, color: "#333" },
    input: { padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff" },
    summary: { padding: "10px 12px", borderRadius: 12, border: "1px solid #eee", background: "#fafafa" },
    summaryTitle: { fontWeight: 800 },
    table: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
    row: { padding: "10px 12px", borderRadius: 12, border: "1px solid #eee", background: "#fff" },
    date: { fontSize: 12, color: "#666", marginBottom: 4 },
    cell: { fontSize: 14 },
    muted: { color: "#666", fontSize: 13 },
    err: { marginTop: 10, color: "#b00020", fontSize: 13 }
};
