import React, { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "../api.js";
import { COLORS } from "../theme.js";

export default function Home({ nav }) {
    const [sessions, setSessions] = useState([]);
    const [err, setErr] = useState("");
    const [bodyweight, setBodyweight] = useState("");

    useEffect(() => {
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
            <div style={styles.section}>
                <label style={styles.label}>Bodyweight (kg)</label>
                <input
                    style={styles.input}
                    inputMode="decimal"
                    value={bodyweight}
                    onChange={(e) => setBodyweight(e.target.value)}
                    placeholder="Required to start"
                />
                <button style={styles.primary} onClick={start}>Start Session</button>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
                <h3 style={styles.h3}>Workouts</h3>
                <div style={styles.list}>
                    {sessions.map((s) => (
                        <div key={s.id} style={styles.sessionRow}>
                            <div>
                                <div style={styles.sessionTitle}>Session #{s.id}</div>
                                <div style={styles.muted}>
                                    {new Date(s.started_at).toLocaleDateString()} • {s.sets} sets
                                    {s.bodyweight_kg ? ` • ${s.bodyweight_kg} kg` : ""}
                                </div>
                            </div>
                            <div style={styles.sessionActions}>
                                <button style={styles.secondarySmall} onClick={() => nav("session", { sessionId: s.id })}>Open</button>
                                <button style={styles.dangerSmall} onClick={() => deleteSession(s.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && <div style={styles.empty}>No workouts yet</div>}
                </div>
            </div>

            <div style={styles.divider} />

            <button style={styles.tertiary} onClick={resetData}>Reset all data</button>

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
    primary: {
        padding: "14px 24px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.mustard,
        color: "#fff",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
    },
    h3: {
        margin: 0,
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    sessionRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 16,
        background: COLORS.bg,
    },
    sessionTitle: {
        fontWeight: 600,
        fontSize: 15,
        color: COLORS.text,
    },
    sessionActions: {
        display: "flex",
        gap: 8,
    },
    secondarySmall: {
        padding: "8px 14px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.card,
        color: COLORS.text,
        fontWeight: 500,
        fontSize: 13,
        cursor: "pointer",
        boxShadow: `0 1px 2px rgba(0,0,0,0.05)`,
    },
    dangerSmall: {
        padding: "8px 14px",
        borderRadius: 9999,
        border: "none",
        background: "transparent",
        color: COLORS.danger,
        fontWeight: 500,
        fontSize: 13,
        cursor: "pointer",
    },
    tertiary: {
        padding: "12px 20px",
        borderRadius: 9999,
        border: "none",
        background: "transparent",
        color: COLORS.textMuted,
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
        alignSelf: "center",
    },
    muted: {
        color: COLORS.textMuted,
        fontSize: 13,
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
