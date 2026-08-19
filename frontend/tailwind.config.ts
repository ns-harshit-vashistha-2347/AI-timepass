import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0d1420",
          soft: "#111a2b",
          muted: "#172236",
        },
        surface: {
          DEFAULT: "#182338",
          hover: "#1f2c46",
          border: "#2a3853",
        },
        text: {
          DEFAULT: "#e8ecf5",
          muted: "#a3adc2",
          subtle: "#6b7893",
        },
        accent: {
          DEFAULT: "#f5b544",
          soft: "#d99730",
          glow: "#ffd280",
        },
        circuit: {
          DEFAULT: "#22d3ee",
          soft: "#0e7490",
          glow: "#67e8f9",
        },
        success: "#4ade80",
        warn: "#fbbf24",
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(10,10,15,0), rgba(10,10,15,1)), radial-gradient(rgba(124,92,255,0.15) 1px, transparent 1px)",
        "aurora":
          "radial-gradient(60% 60% at 30% 20%, rgba(124,92,255,0.25), transparent 60%), radial-gradient(50% 50% at 80% 60%, rgba(62,207,142,0.15), transparent 60%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 250ms ease-out",
        "desk-pulse": "deskPulse 1.1s ease-in-out infinite",
        "desk-scan": "deskScan 1.6s linear infinite",
        "wire-flow": "wireFlow 1.2s linear infinite",
        "spin-slow": "spin 6s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        deskPulse: {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(34,211,238,0.35), 0 0 0px rgba(34,211,238,0)" },
          "50%": { boxShadow: "0 0 0 1px rgba(34,211,238,0.6), 0 0 18px rgba(34,211,238,0.45)" },
        },
        deskScan: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 200%" },
        },
        wireFlow: {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
