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
          50: "#EEF2FF",
          200: "#C7D2FE",
          500: "#3B82F6",
          900: "#1E3A8A",
          soft: "#EEF2FF",
          sky: "#93C5FD",
          vibrant: "#2563EB",
          navy: "#1E3A8A",
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
        // Re-mapped brass to vibrant Royal Blue / Indigo palette
        brass: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#0F172A",
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
          500: "#0284C7", // Replaced orange flag with sleek Sky/Cyan Blue
        },
      },
      fontFamily: {
        display: ["var(--font-sans)", "var(--font-bengali)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "var(--font-bengali)", "system-ui", "sans-serif"],
        bengali: ["var(--font-bengali)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(37,99,235,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
