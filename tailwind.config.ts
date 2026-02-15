import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Base palette - using CSS variables for theme switching
                base: {
                    DEFAULT: "var(--base)",
                    elevated: "var(--base-elevated)",
                    surface: "var(--base-surface)",
                    muted: "var(--base-muted)",
                },
                // Text colors
                content: {
                    primary: "var(--content-primary)",
                    secondary: "var(--content-secondary)",
                    muted: "var(--content-muted)",
                },
                // Status colors
                status: {
                    online: "var(--status-online)",
                    warning: "var(--status-warning)",
                    error: "var(--status-error)",
                    info: "#3b82f6",
                },
                // Accent colors
                accent: {
                    purple: "#8b5cf6",
                    cyan: "#06b6d4",
                    pink: "#ec4899",
                },
                // Border colors
                border: {
                    subtle: "var(--border-subtle)",
                    DEFAULT: "var(--border-default)",
                    emphasis: "var(--border-emphasis)",
                },
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'Segoe UI', 'sans-serif'],
                mono: ['JetBrains Mono', 'Menlo', 'monospace'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            boxShadow: {
                'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
                'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
                'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
            },
        },
    },
    plugins: [],
};
