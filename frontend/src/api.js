export const API_BASE = import.meta.env.VITE_API_BASE || "http://100.100.185.110:8000";
export const CONTROLLER_BASE = import.meta.env.VITE_CONTROLLER_BASE || "http://100.100.185.110:8787";
export const CONTROLLER_APP = import.meta.env.VITE_CONTROLLER_APP || "fitnesstracker";
export const CONTROLLER_TOKEN = import.meta.env.VITE_CONTROLLER_TOKEN || "";

export async function controllerPing() {
    if (!CONTROLLER_BASE || !CONTROLLER_APP) return;
    const headers = CONTROLLER_TOKEN ? { "X-Auth-Token": CONTROLLER_TOKEN } : {};
    try {
        await fetch(`${CONTROLLER_BASE}/api/apps/${CONTROLLER_APP}/ping`, {
            method: "POST",
            headers,
            keepalive: true,
        });
    } catch (_) {
        // best-effort
    }
}

export async function apiGet(path) {
    controllerPing();
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiPost(path, body) {
    controllerPing();
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function apiDelete(path) {
    controllerPing();
    const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
