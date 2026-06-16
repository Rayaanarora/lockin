const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["SF Pro Text", "-apple-system", "BlinkMacSystemFont", "var(--font-sans)", ...fontFamily.sans],
        display: ["SF Pro Display", "-apple-system", "BlinkMacSystemFont", "var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        mutedForeground: "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        primaryForeground: "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        secondaryForeground: "hsl(var(--secondary-foreground))",
        destructive: "hsl(var(--destructive))",
        border: "hsl(var(--border))",
        void: "hsl(var(--background))",
        panel: "hsl(var(--card))",
        acid: "#45FF9A",
        danger: "#FF335F",
        neonBlue: "#40C9FF",
        neonPurple: "#A855F7",
        boxRed: "#DE211E",
        boxOrange: "#DE211E",
        boxMaroon: "#AD1614",
        boxCotton: "#EDEBDE",
        boxNoir: "#1B1716",
        boxGreen: "#18BD00",
        boxTrack: "#1B1716",
        boxPit: "#221C1A",
        boxLine: "#322B29"
      },
      boxShadow: {
        acid: "0 0 30px rgba(69,255,154,.35)",
        danger: "0 0 30px rgba(255,51,95,.35)",
        blue: "0 0 34px rgba(64,201,255,.32)",
        purple: "0 0 38px rgba(168,85,247,.34)"
      }
    }
  },
  plugins: []
};
