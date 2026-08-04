import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          50: "#1e2230",
          100: "#161922",
          200: "#12141c",
          300: "#0e1017",
          400: "#0a0b10",
          DEFAULT: "#12141c",
        },
        lynx: {
          cyan: "#00E5FF",
          blue: "#3B82F6",
          violet: "#8B5CF6",
          purple: "#A855F7",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
        },
        border: "var(--border)",
        muted: "var(--muted)",
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
