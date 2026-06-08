import { ReactNode } from "react";
import "./globals.css";


import { Viewport } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
