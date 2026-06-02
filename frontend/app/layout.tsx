import { ReactNode } from "react";
import "./globals.css";


export const metadata = {
  title: "LOCKIN",
  description: "Mobile-first student mission app",
  manifest: "/manifest.json",
  themeColor: "#0A0A0A"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
