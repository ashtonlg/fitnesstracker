import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    return {
        base: env.VITE_BASE || "./",
        plugins: [react()],
        server: {
            proxy: {
                "/api": {
                    target: "http://api:8000",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ""),
                },
            },
        },
        test: {
            environment: "jsdom",
            setupFiles: "./src/test/setup.js",
        },
    };
});
