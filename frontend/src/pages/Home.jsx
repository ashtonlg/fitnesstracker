import React, { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../api.js";

export default function Home({ nav }) {
    const [exercises, setExercises] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [err, setErr] = useState("");
    const [bodyweight, setBodyweight] = useState("");

    useEffect(() => {
        apiGet("/exercises").then(setExercises).catch((e) => setErr(String(e)));
        loadSessions();
    }, []);

    async function loadSessions() {
        try {
            const rows = await apiGet("/sessions");
            setSessions(rows);
        } catch (e) {
            setErr(String(e));
        }
    }

    async function start() {
        setErr("");
        try {
            if (!bodyweight) throw new Error("Enter bodyweight to start a session");
            const payload = { bodyweight_kg: Number(bodyweight) };
            if (!Number.isFinite(payload.bodyweight_kg) || payload.bodyweight_kg <= 0) {
                throw new Error("Enter a valid bodyweight");
            }
            const s = await apiPost("/sessions/start", payload);
            nav("session", { sessionId: s.id });
        } catch (e) {
            setErr(String(e));
        }
    }

    async function deleteSession(id) {
        if (!confirm("Delete this workout and all its logs?")) return;
        setErr("");
        try {
            await apiDelete(`/sessions/${id}`);
            loadSessions();
        } catch (e) {
            setErr(String(e));
        }
    }

    async function resetData() {
        if (!confirm("Reset all workout logs and goals? This cannot be undone.")) return;
        setErr("");
        try {
            await apiPost("/admin/reset");
            setBodyweight("");
            loadSessions();
        } catch (e) {
            setErr(String(e));
        }
    }

    return (
        <div style={styles.card}>
            <h2 style={styles.h2}>Today</h2>
            <div style={styles.field}>
                <label style={styles.label}>Bodyweight (kg)</label>
                <input
                    style={styles.input}
                    inputMode="decimal"
                    value={bodyweight}
                    onChange={(e) => setBodyweight(e.target.value)}
                    placeholder="required"
                />
            </div>
            <button style={styles.primary} onClick={start}>Start session</button>

            <h3 style={styles.h3}>Exercises (preset)</h3>
            <div style={styles.list}>
                {exercises.map((e) => (
                    <button key={e.id} style={styles.rowBtn} onClick={() => nav("progress", { exerciseId: e.id })}>
                        {e.name}
                    </button>
                ))}
            </div>

            <h3 style={styles.h3}>Workouts</h3>
            <div style={styles.list}>
                {sessions.map((s) => (
                    <div key={s.id} style={styles.sessionRow}>
                        <div>
                            <div style={styles.sessionTitle}>Session #{s.id}</div>
                            <div style={styles.mutedSmall}>
                                {new Date(s.started_at).toLocaleString()} • {s.sets} sets
                                {s.bodyweight_kg ? ` • ${s.bodyweight_kg} kg BW` : ""}
                            </div>
                        </div>
                        <div style={styles.sessionActions}>
                            <button style={styles.rowBtn} onClick={() => nav("session", { sessionId: s.id })}>Open</button>
                            <button style={styles.danger} onClick={() => deleteSession(s.id)}>Delete</button>
                        </div>
                    </div>
                ))}
                {sessions.length === 0 && <div style={styles.muted}>No workouts yet.</div>}
            </div>

            <button style={styles.secondary} onClick={resetData}>Reset all data</button>

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
    primary: { padding: "12px 12px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700 },
    list: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
    rowBtn: { textAlign: "left", padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff" },
    sessionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid #eee", background: "#fafafa" },
    sessionTitle: { fontWeight: 700 },
    sessionActions: { display: "flex", gap: 8 },
    secondary: { padding: "12px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 700, marginTop: 10 },
    danger: { padding: "10px 12px", borderRadius: 12, border: "1px solid #b00020", background: "#fff", color: "#b00020", fontWeight: 800 },
    mutedSmall: { color: "#666", fontSize: 12 },
    err: { marginTop: 10, color: "#b00020", fontSize: 13 }
};
