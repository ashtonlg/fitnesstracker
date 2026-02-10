import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api.js";
import { COLORS } from "../theme.js";
import BodyHeatmap from "../components/BodyHeatmap.jsx";

const BODY_PART_LABELS = {
    legs: "Legs",
    shoulders: "Shoulders",
    chest: "Chest",
    arms: "Arms",
    back: "Back",
    core: "Core",
    other: "Other",
};

function labelFromKey(key) {
    if (!key) return "Other";
    return key.charAt(0).toUpperCase() + key.slice(1);
}

export default function Progress({ nav, exerciseId }) {
    const [exercises, setExercises] = useState([]);
    const [summary, setSummary] = useState([]);
    const [points, setPoints] = useState([]);
    const [heatmapEntries, setHeatmapEntries] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        apiGet("/exercises").then(setExercises).catch((e) => setErr(String(e)));
        apiGet("/progress/summary").then(setSummary).catch((e) => setErr(String(e)));
        apiGet("/heatmap/entries").then(setHeatmapEntries).catch((e) => setErr(String(e)));
    }, []);

    useEffect(() => {
        if (!exerciseId) {
            setPoints([]);
            return;
        }
        apiGet(`/progress/exercise/${exerciseId}`).then(setPoints).catch((e) => setErr(String(e)));
    }, [exerciseId]);

    const exName = useMemo(() => {
        const ex = exercises.find((x) => String(x.id) === String(exerciseId));
        return ex ? ex.name : "Exercise";
    }, [exercises, exerciseId]);

    const latestByExercise = useMemo(() => {
        const map = {};
        for (const item of summary) {
            map[item.exercise_id] = item;
        }
        return map;
    }, [summary]);

    const groupedExercises = useMemo(() => {
        const groups = {};
        for (const ex of exercises) {
            const key = (ex.body_part || "other").toLowerCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(ex);
        }

        const orderedKeys = [
            "legs",
            "shoulders",
            "chest",
            "arms",
            "back",
            "core",
            "other",
        ];

        const dynamicKeys = Object.keys(groups).filter((k) => !orderedKeys.includes(k)).sort();
        const finalKeys = orderedKeys.concat(dynamicKeys);

        return finalKeys
            .filter((key) => groups[key] && groups[key].length)
            .map((key) => {
                const sorted = groups[key].slice().sort((a, b) => a.name.localeCompare(b.name));
                const withData = sorted.filter((e) => latestByExercise[e.id]);
                const withoutData = sorted.filter((e) => !latestByExercise[e.id]);
                return {
                    key,
                    label: BODY_PART_LABELS[key] || labelFromKey(key),
                    items: [...withData, ...withoutData],
                };
            });
    }, [exercises, latestByExercise]);

    const best = useMemo(() => {
        if (!points.length) return null;
        return points.reduce((a, b) => (b.e1rm > a.e1rm ? b : a), points[0]);
    }, [points]);

    const formatKg = (value) => {
        if (!Number.isFinite(Number(value))) return "0";
        const rounded = Math.round(Number(value) * 10) / 10;
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    };

    const formatLatest = (latest) => {
        if (!latest) return "No sets yet";
        const hasBw = latest.total_kg !== undefined && latest.total_kg !== latest.weight_kg;
        const weightLabel = hasBw ? `${formatKg(latest.weight_kg)} kg + BW` : `${formatKg(latest.weight_kg)} kg`;
        return `${weightLabel} × ${latest.reps}`;
    };

    const handlePartClick = (bodyPart, subPart) => {
        // Find the first exercise that matches this body part and sub part
        const matchingExercise = exercises.find(e =>
            e.body_part?.toLowerCase() === bodyPart?.toLowerCase() &&
            (subPart === "compound" || e.sub_part?.toLowerCase() === subPart?.toLowerCase())
        );
        if (matchingExercise) {
            nav("progress", { exerciseId: matchingExercise.id });
        }
    };

    return (
        <div style={styles.container}>
            <BodyHeatmap
                entries={heatmapEntries}
                exercises={exercises}
                onPartClick={handlePartClick}
                timeRange={30}
            />

            <div style={styles.card}>
                <h3 style={styles.h3}>Exercises</h3>
            <div style={styles.groups}>
                {groupedExercises.map((group) => (
                    <div key={group.key} style={styles.group}>
                        <div style={styles.groupHeader}>{group.label}</div>
                        <div style={styles.list}>
                            {group.items.map((e) => {
                                const latest = latestByExercise[e.id];
                                const isSelected = String(e.id) === String(exerciseId);
                                const isEmpty = !latest;
                                return (
                                    <button
                                        key={e.id}
                                        style={{
                                            ...styles.rowBtn,
                                            ...(isSelected ? styles.rowBtnActive : {}),
                                            ...(isEmpty ? styles.rowBtnEmpty : {}),
                                        }}
                                        onClick={() => nav("progress", { exerciseId: e.id })}
                                    >
                                        <div style={styles.exerciseRow}>
                                            <span style={styles.exerciseName}>{e.name}</span>
                                            {latest ? (
                                                <span style={styles.effortBadge}>{formatLatest(latest)}</span>
                                            ) : (
                                                <span style={styles.noEffort}>No sets yet</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {groupedExercises.length === 0 && <div style={styles.empty}>No exercises yet</div>}
            </div>

            {exerciseId && (
                <>
                    <div style={styles.divider} />

                    <div style={styles.summaryCard}>
                        <div style={styles.summaryName}>{exName}</div>
                        {best ? (
                            <div style={styles.summaryStats}>
                                <div style={styles.stat}>
                                    <span style={styles.statValue}>{best.e1rm.toFixed(1)}</span>
                                    <span style={styles.statUnit}>kg e1RM</span>
                                </div>
                                <div style={styles.statDetail}>
                                    {best.weight_kg} kg × {best.reps}
                                </div>
                            </div>
                        ) : (
                            <div style={styles.empty}>No data yet</div>
                        )}
                    </div>

                    <div style={styles.divider} />

                    <h3 style={styles.h3}>History</h3>
                    <div style={styles.list}>
                        {points.slice().reverse().map((p, idx) => (
                            <div key={idx} style={styles.historyRow}>
                                <div style={styles.historyMain}>
                                    <span style={styles.historyWeight}>{p.weight_kg} kg</span>
                                    <span style={styles.historyReps}>× {p.reps}</span>
                                </div>
                                <div style={styles.historyMeta}>
                                    {p.total_kg && p.total_kg !== p.weight_kg && (
                                        <span style={styles.bwTag}>+BW = {p.total_kg} kg</span>
                                    )}
                                    <span style={styles.e1rmTag}>e1RM {p.e1rm.toFixed(1)}</span>
                                </div>
                                <div style={styles.historyDate}>{new Date(p.date).toLocaleDateString()}</div>
                            </div>
                        ))}
                        {points.length === 0 && <div style={styles.empty}>No sets recorded</div>}
                    </div>
                </>
            )}

            {err && <div style={styles.err}>{err}</div>}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        background: COLORS.card,
    },
    groups: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginTop: 12,
    },
    group: {
        display: "flex",
        flexDirection: "column",
    },
    groupHeader: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        marginBottom: 4,
    },
    rowBtn: {
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 14,
        border: `1px solid transparent`,
        background: COLORS.bg,
        cursor: "pointer",
    },
    rowBtnActive: {
        border: `1px solid ${COLORS.mustardLight}`,
        boxShadow: `0 0 0 2px ${COLORS.mustardLight}`,
    },
    rowBtnEmpty: {
        opacity: 0.6,
    },
    exerciseRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    exerciseName: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: 500,
    },
    effortBadge: {
        fontSize: 13,
        color: COLORS.mustardDark,
        fontWeight: 600,
        background: COLORS.mustardLight,
        padding: "4px 10px",
        borderRadius: 9999,
        whiteSpace: "nowrap",
    },
    noEffort: {
        fontSize: 13,
        color: COLORS.textMuted,
        whiteSpace: "nowrap",
    },
    summaryCard: {
        marginTop: 16,
        padding: "20px",
        borderRadius: 16,
        background: COLORS.bg,
        textAlign: "center",
    },
    summaryName: {
        fontSize: 16,
        fontWeight: 600,
        color: COLORS.text,
        marginBottom: 8,
    },
    summaryStats: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
    },
    stat: {
        display: "flex",
        alignItems: "baseline",
        gap: 6,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 700,
        color: COLORS.mustard,
    },
    statUnit: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: 500,
    },
    statDetail: {
        fontSize: 14,
        color: COLORS.textMuted,
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
    list: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 12,
    },
    historyRow: {
        padding: "14px 16px",
        borderRadius: 16,
        background: COLORS.bg,
    },
    historyMain: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    historyWeight: {
        fontSize: 16,
        fontWeight: 600,
        color: COLORS.text,
    },
    historyReps: {
        fontSize: 15,
        color: COLORS.textMuted,
    },
    historyMeta: {
        display: "flex",
        gap: 8,
        marginTop: 6,
        flexWrap: "wrap",
    },
    bwTag: {
        fontSize: 12,
        color: COLORS.mustardDark,
        background: COLORS.mustardLight,
        padding: "2px 8px",
        borderRadius: 9999,
        fontWeight: 500,
    },
    e1rmTag: {
        fontSize: 12,
        color: COLORS.textMuted,
        background: COLORS.card,
        padding: "2px 8px",
        borderRadius: 9999,
        fontWeight: 500,
    },
    historyDate: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 6,
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
