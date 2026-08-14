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
          DEFAULT: "#0a0a0f",
          soft: "#0f0f17",
          muted: "#151520",
        },
        surface: {
          DEFAULT: "#12121c",
          hover: "#1a1a26",
          border: "#22222f",
        },
        text: {
          DEFAULT: "#e8e8f0",
          muted: "#9a9ab0",
          subtle: "#6a6a80",
        },
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#5b3fd9",
          glow: "#a084ff",
        },
        success: "#3ecf8e",
        warn: "#f5a524",
        danger: "#f43f5e",
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
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
