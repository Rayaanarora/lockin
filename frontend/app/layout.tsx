import { ReactNode } from "react";
import "./globals.css";


import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0A0A0A"
};

export const metadata = {
  title: "LOCKIN",
  description: "Mobile-first student mission app",
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="font-sans">
      <body>{children}</body>
    </html>
  );
}
