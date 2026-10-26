import path from "node:path";

const isDev = process.env.NODE_ENV !== "production";

// Only our own origin and the Supabase project may be contacted.
const supabase = "https://*.supabase.co wss://*.supabase.co";

const csp = [
  "default-src 'self'",
  // Next.js inlines its bootstrap scripts; dev mode also needs eval for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  // Voice messages: signed Supabase Storage URLs and local recordings (blob:).
  "media-src 'self' blob: https://*.supabase.co",
  "font-src 'self' data:",
  `connect-src 'self' data: blob: ${supabase}${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }])
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve("."),
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API responses carry personal data: never cache them anywhere.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] }
    ];
  }
};

export default nextConfig;
