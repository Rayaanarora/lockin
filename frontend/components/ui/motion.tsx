"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion, MotionConfig, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ease, rise, stagger } from "../../lib/motion";

/** Root motion config: honours the OS reduced-motion setting everywhere. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Staggered list container. Children should be <Reveal.Item>. */
export function Reveal({
  children,
  className,
  each = 0.05,
  delay = 0,
  as = "div"
}: {
  children: React.ReactNode;
  className?: string;
  each?: number;
  delay?: number;
  as?: "div" | "ul" | "section";
}) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={stagger(each, delay)} initial="hidden" animate="show">
      {children}
    </Comp>
  );
}

Reveal.Item = function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={rise}>
      {children}
    </motion.div>
  );
};

/** Number that counts up to `value` when it scrolls into view. Used for Aura and stats. */
export function CountUp({ value, className, duration = 1.1 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [first, setFirst] = useState(true);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: first ? duration : 0.5, ease: ease.out });
    setFirst(false);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  return (
    <motion.span ref={ref} className={`tabular ${className ?? ""}`}>
      {rounded}
    </motion.span>
  );
}

/** Skeleton block with a travelling sheen. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-raised ${className}`} aria-hidden="true">
      <motion.div
        className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
        animate={{ x: ["0%", "300%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/**
 * Pointer-follow spotlight for cards on devices with a fine pointer.
 * Wrap a card's contents; the glow tracks the cursor in cherry.
 */
export function Spotlight({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const bg = useTransform(
    [x, y] as any,
    ([cx, cy]: number[]) => `radial-gradient(260px circle at ${cx}px ${cy}px, rgb(var(--signal) / 0.12), transparent 70%)`
  );
  return (
    <div
      className={`group relative ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        x.set(-200);
        y.set(-200);
      }}
    >
      <motion.div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]" style={{ background: bg }} />
      {children}
    </div>
  );
}

/** Renders children on <body> so fixed overlays escape transformed/filtered ancestors. */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
