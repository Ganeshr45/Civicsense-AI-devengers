/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2421",
        teal: {
          DEFAULT: "#0B4F4A",
          dark: "#083A36",
          light: "#0F6E67",
        },
        amber: {
          DEFAULT: "#F2A93B",
          dark: "#D98D1F",
        },
        paper: "#FAFAF8",
        line: "#E4E1D8",
        rust: "#C1502E",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
