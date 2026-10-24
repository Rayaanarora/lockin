"use client";

import React, { useEffect, useState } from "react";
import { subscribeInflight } from "../lib/api";

/**
 * Thin brand-red bar across the top of the screen while any API request is in
 * flight. It waits 150 ms before appearing so instant responses don't flicker,
 * and stays at least 300 ms once shown so it never just blinks.
 */
export default function TopLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let shownAt = 0;

    const unsubscribe = subscribeInflight((n) => {
      if (n > 0) {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        if (!showTimer && !shownAt) {
          showTimer = setTimeout(() => {
            showTimer = null;
            shownAt = Date.now();
            setVisible(true);
          }, 150);
        }
      } else {
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        if (shownAt) {
          const wait = Math.max(0, 300 - (Date.now() - shownAt));
          hideTimer = setTimeout(() => {
            hideTimer = null;
            shownAt = 0;
            setVisible(false);
          }, wait);
        }
      }
    });

    return () => {
      unsubscribe();
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      role="progressbar"
      aria-label="Loading"
      className={`top-loader pointer-events-none fixed inset-x-0 z-[10000] h-[2px] overflow-hidden transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      {visible && <div className="top-loader-bar h-full w-1/3 bg-signal" />}
    </div>
  );
}
