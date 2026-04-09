import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f6f8fb",
        card: "#ffffff",
        line: "#d9e2f1",
        primary: "#1d4ed8"
      }
    }
  },
  plugins: []
};

export default config;
