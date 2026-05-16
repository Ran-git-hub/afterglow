import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#080b10",
        ink: "#0d1117",
        mist: "#aeb7c2",
        dim: "#66707d",
        ember: "#c7a768",
        frost: "#8fb7c7"
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "ui-monospace", "monospace"]
      },
      boxShadow: {
        glow: "0 0 42px rgba(199, 167, 104, 0.12), 0 0 90px rgba(143, 183, 199, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
