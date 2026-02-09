import React, { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Session from "./pages/Session.jsx";
import Progress from "./pages/Progress.jsx";
import Goals from "./pages/Goals.jsx";

export default function App() {
    const [route, setRoute] = useState({ name: "home", params: {} });

    const nav = (name, params = {}) => setRoute({ name, params });

    return (
        <div style={styles.shell}>
            <header style={styles.header}>
                <div style={styles.title} onClick={() => nav("home")}>Gym</div>
                <div style={styles.tabs}>
                    <button style={styles.tabBtn} onClick={() => nav("home")}>Home</button>
                    <button style={styles.tabBtn} onClick={() => nav("progress")}>Progress</button>
                    <button style={styles.tabBtn} onClick={() => nav("goals")}>Goals</button>
                </div>
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
    shell: { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: 12, maxWidth: 520, margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 },
    title: { fontWeight: 800, fontSize: 20, cursor: "pointer" },
    tabs: { display: "flex", gap: 8 },
    tabBtn: { padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", background: "#fff" },
    main: { display: "flex", flexDirection: "column", gap: 12 }
};
