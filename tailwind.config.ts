import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        foreground: "#f8fafc",
        card: {
          DEFAULT: "rgba(18, 18, 18, 0.65)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(28, 28, 30, 0.8)",
        },
        brand: {
          primary: "#ff0000", // YouTube Red
          secondary: "#e11d48", // Rose-600
          accent: "#f59e0b", // Amber
          rose: "#f43f5e",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "pulse-subtle": "pulseSubtle 2s infinite ease-in-out",
        "shuffle": "shuffleAnim 0.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shuffleAnim: {
          "0%, 100%": { transform: "rotate(-2deg) scale(0.98)" },
          "50%": { transform: "rotate(2deg) scale(1.02)" },
        }
      },
    },
  },
  plugins: [],
};
export default config;
