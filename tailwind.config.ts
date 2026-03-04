import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f0f12",
          card: "#18181c",
          elevated: "#1f1f24",
        },
        accent: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "system-ui", "sans-serif"],
        mono: ["var(--font-nunito)", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(99, 102, 241, 0.4)",
        "glow-lg": "0 0 60px -15px rgba(99, 102, 241, 0.35)",
        card: "0 4px 24px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02) inset",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
