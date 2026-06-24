import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: path.resolve("."),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:4000/socket.io/:path*",
      }
    ];
  }
};

export default nextConfig;
