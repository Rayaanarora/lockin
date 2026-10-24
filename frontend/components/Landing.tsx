"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LockinMark, LockinWordmark } from "./ui/LockinLogo";
import { ease } from "../lib/motion";
import { POINTS_NAME } from "../lib/brand";

/*
 * Logged-out landing, built from the brand sheet: clean Void, hairlines,
 * the stag lockup beside a light Space Grotesk statement. One authored
 * motion moment: the mark draws itself, then the headline types.
 */

const WORDS = ["Lock in.", "Build.", "Ship."];
const FINAL = ["Stop planning.", "Start showing up."];

const LOOP = [
  { n: "01", title: "Discover", desc: "See what people on your campus are about to do, right now." },
  { n: "02", title: "Lock in", desc: "Commit to a mission, solo or with a crew. Swipe right and you're in." },
  { n: "03", title: "Show up", desc: `Check in with a code, do the work, build your ${POINTS_NAME}.` }
];

// The mark finishes drawing at about this point; typing starts after it.
const TYPE_START_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Types each word, deletes it, then types the two-line manifesto and stops. */
function useManifesto(reduce: boolean | null) {
  const [lines, setLines] = useState<[string, string]>(["", ""]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduce) {
      setLines([FINAL[0], FINAL[1]]);
      setDone(true);
      return;
    }
    let live = true;
    (async () => {
      await sleep(TYPE_START_MS);
      for (const word of WORDS) {
        for (let i = 1; i <= word.length && live; i++) {
          setLines([word.slice(0, i), ""]);
          await sleep(75);
        }
        await sleep(650);
        for (let i = word.length - 1; i >= 0 && live; i--) {
          setLines([word.slice(0, i), ""]);
          await sleep(32);
        }
        await sleep(160);
      }
      for (let i = 1; i <= FINAL[0].length && live; i++) {
        setLines([FINAL[0].slice(0, i), ""]);
        await sleep(55);
      }
      await sleep(260);
      for (let i = 1; i <= FINAL[1].length && live; i++) {
        setLines([FINAL[0], FINAL[1].slice(0, i)]);
        await sleep(55);
      }
      if (live) setDone(true);
    })();
    return () => {
      live = false;
    };
  }, [reduce]);

  return { lines, done };
}

/** Button that leans toward the pointer. */
function Magnetic({
  children,
  className,
  onClick,
  disabled
}: {
  children: React.ReactNode;
  className: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.97 }}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/** The brand lockup: stag over wordmark over caption, as on the brand sheet. */
function Lockup() {
  return (
    <div className="flex flex-col items-start lg:items-center">
      <div className="lg:hidden">
        <LockinMark size={84} color="rgb(var(--ink))" animate />
      </div>
      <div className="hidden lg:block">
        <LockinMark size={232} color="rgb(var(--ink))" animate />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8, ease: ease.out }}
        className="mt-6 flex flex-col items-start lg:mt-12 lg:items-center"
      >
        <LockinWordmark size="lg" className="lg:hidden" />
        <LockinWordmark size="xl" className="hidden lg:inline" />
        <span className="t-label mt-3 lg:mt-5">The action network</span>
      </motion.div>
    </div>
  );
}

export default function Landing({
  onLogin,
  onSignup,
  onDemoLogin,
  busy
}: {
  onLogin: () => void;
  onSignup: () => void;
  onDemoLogin?: () => void;
  busy?: boolean;
}) {
  const reduce = useReducedMotion();
  const { lines, done } = useManifesto(reduce);
  const typing = !lines[1] && !done;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-bg text-ink">
      <motion.div
        aria-hidden="true"
        className="race-stripe pointer-events-none fixed inset-x-0 top-0 z-50 h-px origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: ease.out }}
      />

      {/* ── Top bar ── */}
      <header className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 pt-7 md:px-12">
        {/* On phones the lockup sits right below and already names the brand. */}
        <p className="t-section hidden text-crimson sm:block">LOCKIN — The action network for doers</p>
        <span className="sm:hidden" />
        <button type="button" onClick={onLogin} className="t-label -mr-3 h-11 px-3 transition-colors hover:text-ink">
          Log in
        </button>
      </header>

      {/* ── Hero: statement left, lockup right (lockup first on phones) ── */}
      <main className="mx-auto grid w-full max-w-[1240px] flex-1 content-center gap-12 px-6 py-14 md:px-12 lg:min-h-[min(calc(100dvh-160px),780px)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-20 lg:py-10">
        <div className="lg:order-2 lg:pr-4">
          <Lockup />
        </div>

        <div className="lg:order-1">
          <h1
            aria-label={`${FINAL[0]} ${FINAL[1]}`}
            className="t-display min-h-[1.95em] text-[clamp(38px,10.4vw,64px)] leading-[0.98] tracking-[-0.04em] text-ink max-[360px]:text-[9vw] lg:text-[clamp(64px,6.4vw,96px)]"
          >
            <span aria-hidden="true">
              <span className="block">
                {lines[0]}
                {typing && <Caret />}
              </span>
              <span className="block text-crimson-display">
                {lines[1]}
                {!typing && <Caret blink={done} />}
              </span>
            </span>
          </h1>

          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 1, ease: ease.out }}
            className="mt-8 h-px w-16 origin-left bg-signal"
          />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.9, ease: ease.out }}
            className="mt-8 max-w-[500px] text-[17px] font-light leading-relaxed text-ink-2 md:text-[19px]"
          >
            A private, campus-only network for builders, founders and creators who finish what they start. Post a mission, lock in with people near you, and prove you showed up.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.9, ease: ease.out }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Magnetic onClick={onSignup} className="btn-primary group h-14 px-9">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Magnetic>
            <Magnetic onClick={onLogin} className="btn-ghost h-14 border-ink/20 px-9 text-ink-2">
              I have an account
            </Magnetic>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.9 }}
            className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            <p className="t-label">College email required</p>
            {onDemoLogin && (
              <button
                type="button"
                disabled={busy}
                onClick={onDemoLogin}
                className="h-10 text-subhead text-ink-3 underline-offset-4 transition-colors hover:text-ink-2 hover:underline disabled:opacity-50"
              >
                Try the demo account
              </button>
            )}
          </motion.div>
        </div>
      </main>

      {/* ── How it works ── */}
      <section aria-labelledby="loop-title" className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-12 lg:py-24">
          <h2 id="loop-title" className="t-section text-crimson">
            How it works
          </h2>
          <ol className="mt-10 grid md:grid-cols-3">
            {LOOP.map((item, i) => (
              <motion.li
                key={item.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: ease.out }}
                className="border-t border-line py-8 md:border-l md:border-t-0 md:px-8 md:py-2 md:first:border-l-0 md:first:pl-0"
              >
                <span className="t-display tabular text-[48px] leading-none text-crimson-display">{item.n}</span>
                <h3 className="mt-5 text-title-2 text-ink">{item.title}</h3>
                <p className="mt-2 max-w-[320px] text-pretty text-body font-light text-ink-2">{item.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Footer, as on the brand sheet ── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-12">
          <p className="t-label">LOCKIN — The action network for doers</p>
          <p className="t-label hidden lg:block">Stop scrolling. Start showing up.</p>
          <a
            href="https://instagram.com/lockin.top"
            target="_blank"
            rel="noopener noreferrer"
            className="t-label text-crimson transition-colors hover:text-ink"
          >
            @lockin.top
          </a>
        </div>
      </footer>
    </div>
  );
}

function Caret({ blink = false }: { blink?: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      animate={blink ? { opacity: [1, 0, 1] } : { opacity: 1 }}
      transition={blink ? { duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.5, 1] } : undefined}
      className="ml-[0.06em] inline-block h-[0.82em] w-[0.06em] translate-y-[0.08em] bg-signal align-baseline"
    />
  );
}
