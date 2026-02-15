import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Base palette - Dark Mode
                base: {
                    DEFAULT: "#09090b",
                    elevated: "#18181b",
                    surface: "#27272a",
                    muted: "#3f3f46",
                },
                // Text colors
                content: {
                    primary: "#fafafa",
                    secondary: "#a1a1aa",
                    muted: "#71717a",
                    accent: "#a78bfa",
                },
                // Status colors
                status: {
                    online: "#4ade80",
                    warning: "#fbbf24",
                    error: "#f87171",
                    info: "#60a5fa",
                },
                // Accent colors
                accent: {
                    purple: "#a78bfa",
                    cyan: "#22d3ee",
                    pink: "#f472b6",
                },
                // Border colors
                border: {
                    subtle: "#27272a",
                    DEFAULT: "#3f3f46",
                    emphasis: "#52525b",
                },
            },
            fontFamily: {
                mono: ["JetBrains Mono", "Fira Code", "SF Mono", "monospace"],
                sans: ["Inter", "-apple-system", "Segoe UI", "sans-serif"],
            },
            animation: {
                "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "spin-slow": "spin 1s linear infinite",
                "fade-in": "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                "status-pulse": "statusPulse 2s ease-in-out infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                statusPulse: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5" },
                },
            },
            boxShadow: {
                glow: "0 0 20px rgba(167, 139, 250, 0.15)",
                "glow-green": "0 0 8px rgba(74, 222, 128, 0.8)",
                "glow-yellow": "0 0 8px rgba(251, 191, 36, 0.8)",
                "glow-red": "0 0 8px rgba(248, 113, 113, 0.8)",
            },
        },
    },
    plugins: [],
} satisfies Config;
