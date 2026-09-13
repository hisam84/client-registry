import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070E1A",
        // The requested 4-color blue palette
        palette: {
          50: "#E3F2FD",
          200: "#90CAF9",
          500: "#2196F3",
          900: "#0D47A1",
          soft: "#E3F2FD",
          sky: "#90CAF9",
          vibrant: "#2196F3",
          navy: "#0D47A1",
        },
        slate: {
          950: "#070E1A",
          900: "#0D1B2A",
          850: "#112240",
          800: "#1B2E4B",
          700: "#2B436B",
          600: "#415E8D",
          500: "#627FA8",
          400: "#8EA4C7",
          300: "#B8C9E4",
          200: "#D0DEF5",
          100: "#E3F2FD",
          50: "#F0F7FF",
        },
        // Re-mapped brass to the blue palette spectrum so all existing component accents inherit it seamlessly
        brass: {
          50: "#E3F2FD",
          100: "#E3F2FD",
          200: "#BBDEFB",
          300: "#90CAF9",
          400: "#64B5F6",
          500: "#2196F3",
          600: "#1E88E5",
          700: "#1976D2",
          800: "#1565C0",
          900: "#0D47A1",
        },
        moss: {
          500: "#10B981",
          400: "#34D399",
        },
        rust: {
          500: "#EF4444",
          400: "#F87171",
        },
        amberflag: {
          500: "#F59E0B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        bengali: ["var(--font-bengali)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(13,71,161,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
