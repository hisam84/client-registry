import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12161C",
        slate: {
          950: "#0B0E13",
          900: "#12161C",
          850: "#181D25",
          800: "#1F2530",
          700: "#2A313E",
          600: "#3B4453",
          500: "#5A6579",
          400: "#8891A0",
          300: "#B3BAC6",
          100: "#E7E9ED",
        },
        brass: {
          500: "#C08A3E",
          400: "#D6A45E",
          300: "#E8C48C",
        },
        moss: {
          500: "#4C7A5E",
          400: "#6C9B7C",
        },
        rust: {
          500: "#B0503F",
          400: "#C97260",
        },
        amberflag: {
          500: "#C99A2E",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        bengali: ["var(--font-bengali)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
