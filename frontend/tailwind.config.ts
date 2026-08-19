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
        // Warp — modern developer terminal
        bg: {
          DEFAULT: "#0a0a10",     // page ground
          soft: "#101017",        // panel
          raised: "#14141c",      // raised surface
        },
        chrome: {
          DEFAULT: "#1c1c26",     // window chrome
          hover: "#22222e",
          border: "#26263a",
        },
        line: {
          DEFAULT: "#2e2e44",
          soft: "#1e1e2c",
        },
        ink: {
          DEFAULT: "#e9e6f2",
          muted: "#a5a2b8",
          dim: "#7a789a",
          faint: "#4a4a5a",
        },
        // purple is the signature — used for prompts, active state, links
        prompt: {
          DEFAULT: "#a78bfa",
          soft: "#7c5cff",
          glow: "#c4b5fd",
        },
        // green = done / ready
        ok: {
          DEFAULT: "#7fd8a0",
          soft: "#4ba672",
        },
        // amber = wait
        warn: "#ffb84a",
        // rose = fail / delete
        danger: "#ff6b6b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      boxShadow: {
        block: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        prompt: "0 0 0 1px rgba(167,139,250,0.35), 0 0 24px -6px rgba(167,139,250,0.45)",
        glow: "0 0 12px -2px rgba(167,139,250,0.6)",
      },
      backgroundImage: {
        "warp-grid":
          "linear-gradient(rgba(167,139,250,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.05) 1px, transparent 1px)",
        "warp-glow":
          "radial-gradient(80% 60% at 100% 0%, rgba(167,139,250,0.14), transparent 60%)",
      },
      animation: {
        "blink": "blink 1s steps(2) infinite",
        "bar-shimmer": "barShimmer 1.4s ease-in-out infinite",
        "pulse-ring": "pulseRing 1.6s ease-out infinite",
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        blink: { "0%, 49%": { opacity: "1" }, "50%, 100%": { opacity: "0" } },
        barShimmer: {
          "0%, 100%": { transform: "translateX(-100%)" },
          "60%": { transform: "translateX(100%)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.6)", opacity: "1" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
