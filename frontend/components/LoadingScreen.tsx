"use client";

import React from "react";
import { motion } from "framer-motion";
import { LockinLogo } from "./ui/LockinLogo";

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex select-none flex-col items-center justify-center overflow-hidden bg-bg"
      role="status"
      aria-label="Loading LOCKIN"
    >
      <div className="grid-noise pointer-events-none absolute inset-0" />

      <LockinLogo layout="stacked" size="lg" animate />

      {/* Lock line: indeterminate progress in brand red */}
      <div className="relative mt-12 h-px w-40 overflow-hidden bg-line">
        <motion.div
          className="race-stripe absolute inset-y-0 w-1/2"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ delay: 1.2, duration: 1.2, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>
    </div>
  );
}
