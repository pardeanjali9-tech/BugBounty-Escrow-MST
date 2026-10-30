/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: "#FAF8F5",
          100: "#F5F2EB",
          200: "#EBE6DA",
          300: "#DCD5C3",
          400: "#C9BFAB",
        },
        graphite: {
          950: "#0D0E10",
          900: "#141619",
          850: "#1A1D21",
          800: "#22262C",
          700: "#2F343C",
          600: "#444A54",
          500: "#636B79",
          400: "#8B93A1",
          300: "#B8BEC9",
          200: "#DFE2E8",
          100: "#F0F2F5",
        },
        coral: {
          600: "#B84728",
          500: "#D25835",
          400: "#E27353",
          300: "#EF9981",
          100: "#FCEEEA",
          50: "#FDF6F4",
        },
        mint: {
          600: "#226354",
          500: "#2D7C6B",
          400: "#429784",
          300: "#6CB3A2",
          100: "#E5F4F0",
          50: "#F2F9F7",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        serif: ["Newsreader", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "0.85rem" }],
      },
    },
  },
  plugins: [],
};

