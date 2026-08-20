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
        // Monokai — Sublime Text classic
        bg: {
          DEFAULT: "#272822",     // page ground (monokai base)
          soft: "#1e1f1c",        // panel (darker)
          raised: "#33342d",      // raised surface (highlighted line)
        },
        chrome: {
          DEFAULT: "#1e1f1c",     // window chrome (title bar)
          hover: "#3e3d32",       // selection / hover
          border: "#3e3d32",      // border / gutter
        },
        line: {
          DEFAULT: "#49483e",     // highlight line
          soft: "#3e3d32",
        },
        ink: {
          DEFAULT: "#f8f8f2",     // foreground (monokai fg)
          muted: "#cfd0c2",
          dim: "#a6a68c",
          faint: "#75715e",       // monokai comment color
        },
        // pink is the new prompt/signature — monokai keyword
        prompt: {
          DEFAULT: "#f92672",     // pink (keywords)
          soft: "#d81b60",
          glow: "#ff79c6",
        },
        // monokai palette accents
        mk: {
          pink: "#f92672",
          green: "#a6e22e",
          yellow: "#e6db74",
          orange: "#fd971f",
          purple: "#ae81ff",
          blue: "#66d9ef",
          comment: "#75715e",
        },
        // green = done / ready (function name in monokai)
        ok: {
          DEFAULT: "#a6e22e",
          soft: "#7cb342",
        },
        // yellow/orange = wait (string / constant)
        warn: "#fd971f",
        // pink = fail / delete (keyword)
        danger: "#f92672",
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
        DEFAULT: "4px",
      },
      boxShadow: {
        block: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.7)",
        prompt: "0 0 0 1px rgba(249,38,114,0.45), 0 0 24px -6px rgba(249,38,114,0.5)",
        glow: "0 0 12px -2px rgba(249,38,114,0.6)",
        term: "inset 0 0 0 1px #3e3d32, 0 20px 40px -20px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "warp-grid":
          "linear-gradient(rgba(249,38,114,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(249,38,114,0.05) 1px, transparent 1px)",
        "warp-glow":
          "radial-gradient(80% 60% at 100% 0%, rgba(249,38,114,0.12), transparent 60%)",
        "scanline":
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
      },
      animation: {
        "blink": "blink 1s steps(2) infinite",
        "bar-shimmer": "barShimmer 1.4s ease-in-out infinite",
        "pulse-ring": "pulseRing 1.6s ease-out infinite",
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        "flicker": "flicker 3s linear infinite",
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
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.97" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
