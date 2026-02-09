import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api.js";

export default function Home({ nav }) {
    const [exercises, setExercises] = useState([]);
    const [err, setErr] = useState("");
    const [bodyweight, setBodyweight] = useState("");

    useEffect(() => {
        apiGet("/exercises").then(setExercises).catch((e) => setErr(String(e)));
    }, []);

    async function start() {
        setErr("");
        try {
            const payload = bodyweight ? { bodyweight_kg: Number(bodyweight) } : null;
            const s = await apiPost("/sessions/start", payload);
            nav("session", { sessionId: s.id });
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
                    placeholder="optional"
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
    err: { marginTop: 10, color: "#b00020", fontSize: 13 }
};
