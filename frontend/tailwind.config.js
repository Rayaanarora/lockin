const { fontFamily } = require("tailwindcss/defaultTheme");

// Channels are defined in app/globals.css so every token supports /opacity.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // Brand: flat and near-square. Circles (full) stay for avatars and dots.
    borderRadius: {
      none: "0",
      sm: "2px",
      DEFAULT: "2px",
      md: "2px",
      lg: "2px",
      xl: "3px",
      "2xl": "3px",
      "3xl": "4px",
      full: "9999px",
      card: "3px",
      sheet: "4px"
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        display: ["var(--font-display)", "var(--font-sans)", ...fontFamily.sans]
      },
      fontSize: {
        // Space Grotesk scale: light headlines, medium UI.
        "large-title": ["40px", { lineHeight: "42px", letterSpacing: "-0.035em", fontWeight: "300" }],
        "title-1": ["30px", { lineHeight: "34px", letterSpacing: "-0.03em", fontWeight: "300" }],
        "title-2": ["22px", { lineHeight: "28px", letterSpacing: "-0.02em", fontWeight: "400" }],
        "title-3": ["19px", { lineHeight: "25px", letterSpacing: "-0.015em", fontWeight: "500" }],
        headline: ["16px", { lineHeight: "22px", letterSpacing: "-0.01em", fontWeight: "500" }],
        body: ["16px", { lineHeight: "24px", letterSpacing: "-0.005em" }],
        callout: ["16px", { lineHeight: "22px" }],
        subhead: ["14px", { lineHeight: "20px" }],
        footnote: ["13px", { lineHeight: "18px" }],
        caption: ["12px", { lineHeight: "16px" }],
        micro: ["11px", { lineHeight: "14px", letterSpacing: "0.22em" }]
      },
      colors: {
        // ── Surfaces ──
        bg: token("bg"),
        surface: token("surface"),
        raised: token("raised"),
        overlay: token("overlay"),
        line: token("line"),
        // ── Text ──
        ink: token("ink"),
        "ink-2": token("ink-2"),
        "ink-3": token("ink-3"),
        // ── Brand ──
        signal: token("signal"), // brand Crimson #B11226: lines, fills, strokes
        crimson: token("crimson-text"), // text-only crimson (#E92A42, 4.5:1+)
        cherry: token("cherry"), // deeper crimson for pressed/fills
        maroon: token("maroon"),
        gold: token("gold"), // retired; resolves to Signal off-white
        success: token("success"),
        warn: token("warn"),

        // ── shadcn primitives ──
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

        // ── Legacy aliases (kept so existing class names resolve to brand values) ──
        void: token("bg"),
        panel: token("surface"),
        noirBlack: token("bg"),
        cotton: token("ink"),
        cherryRed: token("signal"),
        acid: token("signal"),
        danger: token("signal"),
        neonPurple: token("signal"),
        neonBlue: token("ink"),
        luxuryMaroon: token("maroon"),
        luxuryGold: token("gold"),
        boxRed: token("signal"),
        boxMaroon: token("maroon"),
        boxOrange: token("warn"),
        boxGreen: token("success"),
        boxCotton: token("ink"),
        boxNoir: token("bg"),
        boxTrack: token("bg"),
        boxPit: token("bg"),
        boxLine: token("maroon")
      },
      boxShadow: {
        // Flat brand: no button shadows; one soft lift for overlays only.
        cta: "none",
        lift: "0 24px 48px -24px rgb(0 0 0 / 0.9)",
        danger: "0 8px 32px -8px rgb(var(--signal) / 0.45)",
        acid: "0 8px 32px -8px rgb(var(--signal) / 0.45)",
        blue: "0 8px 32px -8px rgb(var(--ink) / 0.2)",
        purple: "0 8px 32px -8px rgb(var(--cherry) / 0.5)"
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};
