import React, { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Session from "./pages/Session.jsx";
import Progress from "./pages/Progress.jsx";
import Goals from "./pages/Goals.jsx";
import { COLORS } from "./theme.js";

export default function App() {
    const [route, setRoute] = useState({ name: "home", params: {} });

    const nav = (name, params = {}) => setRoute({ name, params });

    return (
        <div style={styles.shell}>
            <header style={styles.header}>
                <div style={styles.title} onClick={() => nav("home")}>Fitness Tracker</div>
                <nav style={styles.nav}>
                    <button
                        style={route.name === "home" ? styles.navBtnActive : styles.navBtn}
                        onClick={() => nav("home")}
                    >
                        Home
                    </button>
                    <button
                        style={route.name === "progress" ? styles.navBtnActive : styles.navBtn}
                        onClick={() => nav("progress")}
                    >
                        Progress
                    </button>
                    <button
                        style={route.name === "goals" ? styles.navBtnActive : styles.navBtn}
                        onClick={() => nav("goals")}
                    >
                        Goals
                    </button>
                </nav>
            </header>

            <main style={styles.main}>
                {route.name === "home" && <Home nav={nav} />}
                {route.name === "session" && <Session nav={nav} sessionId={route.params.sessionId} />}
                {route.name === "progress" && <Progress nav={nav} exerciseId={route.params.exerciseId} />}
                {route.name === "goals" && <Goals nav={nav} />}
            </main>
        </div>
    );
}

const styles = {
    shell: {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: 16,
        maxWidth: 520,
        margin: "0 auto",
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        boxSizing: "border-box",
    },
    header: {
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: `1px solid ${COLORS.border}`,
    },
    title: {
        fontWeight: 700,
        fontSize: 22,
        cursor: "pointer",
        color: COLORS.text,
        letterSpacing: "-0.5px",
    },
    nav: {
        display: "flex",
        gap: 8,
    },
    navBtn: {
        padding: "8px 16px",
        borderRadius: 9999,
        border: "none",
        background: "transparent",
        color: COLORS.textMuted,
        fontWeight: 500,
        fontSize: 14,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    navBtnActive: {
        padding: "8px 16px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.mustardLight,
        color: COLORS.mustardDark,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
    },
    main: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
};
