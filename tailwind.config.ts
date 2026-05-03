import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101820",
        graphite: "#242a31",
        steel: "#667085",
        signal: "#d71920",
        amberline: "#f5a524"
      },
      boxShadow: {
        premium: "0 18px 60px rgba(16, 24, 32, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
