import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sage palette — primary brand color
        sage: {
          50: "#F0FBF4",
          100: "#DEF7E4",
          200: "#C2EFD1",
          300: "#A6E2BE",
          400: "#8AD5AB",
          500: "#6EC898",
          600: "#52B788",
          700: "#3D8A67",
          800: "#357A5B",
          900: "#2D6A4F",
        },
        // Warm neutrals — background / surface
        warm: {
          50: "#F8F7F4",
          100: "#F0EDE8",
          200: "#E5E0DA",
        },
        // Ink — text
        ink: {
          400: "#9E9E9E",
          600: "#6B6B6B",
          900: "#1A1A1A",
        },
        // Risk levels
        risk: {
          critical: "#C0392B",
          high: "#E07A1F",
          medium: "#F1C40F",
          low: "#2980B9",
        },
        // Surface states
        surface: {
          critical: "#FDECEA",
          warning: "#FEF3E2",
          info: "#EBF5FB",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Menlo", "monospace"],
      },
      spacing: {
        // 4px base scale — explicit named tokens
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
