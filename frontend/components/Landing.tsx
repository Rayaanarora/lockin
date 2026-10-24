"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LockinLogo } from "./ui/LockinLogo";
import { ease } from "../lib/motion";
import { POINTS_NAME } from "../lib/brand";

/*
 * Logged-out landing. Cinematic void: film grain, scanlines, crop-mark frame
 * and one typed manifesto headline. Restraint is the point.
 */

const WORDS = ["Lock in.", "Build.", "Ship."];
const FINAL = ["Stop planning.", "Start showing up."];

const LOOP = [
  { n: "01", title: "Discover", desc: "See what people on your campus are about to do, right now." },
  { n: "02", title: "Lock in", desc: "Commit to a mission, solo or with a crew. Swipe right and you're in." },
  { n: "03", title: "Show up", desc: `Check in with a code, do the work, build your ${POINTS_NAME}.` }
];

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
      await sleep(900);
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

/** Live clock, mounted client-side only so it never mismatches hydration. */
function useClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** One noise tile, generated once and jittered by CSS. */
function FilmGrain() {
  const [tile, setTile] = useState<string | null>(null);
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    setTile(c.toDataURL("image/png"));
  }, []);
  if (!tile) return null;
  return (
    <div
      aria-hidden="true"
      className="film-grain pointer-events-none fixed -inset-[100px] z-[1] opacity-[0.055]"
      style={{ backgroundImage: `url(${tile})` }}
    />
  );
}

function CropMarks() {
  const corner = "absolute h-4 w-4 border-ink/30";
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 1.2 }}
      className="pointer-events-none fixed inset-3 z-[2] md:inset-5"
    >
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </motion.div>
  );
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
        x.set((e.clientX - (r.left + r.width / 2)) * 0.22);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
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
  const clock = useClock();
  const typing = !lines[1] && !done;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-bg text-ink">
      <FilmGrain />
      <div aria-hidden="true" className="scanlines pointer-events-none fixed inset-0 z-[1]" />
      <CropMarks />
      <motion.div
        aria-hidden="true"
        className="race-stripe pointer-events-none fixed inset-x-0 top-0 z-50 h-px origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: ease.out }}
      />

      {/* ── Top bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: ease.out }}
        className="relative z-20 flex items-center justify-between px-6 pt-7 md:px-12 lg:px-20"
      >
        <LockinLogo size="sm" />
        <p className="t-label hidden tabular md:block" aria-hidden="true">
          <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal align-middle" />
          IST {clock ?? "--:--:--"}
        </p>
        <button type="button" onClick={onLogin} className="t-label -mr-3 h-11 px-3 transition-colors hover:text-ink">
          Log in
        </button>
      </motion.header>

      {/* ── Hero: one centred statement, nothing competing with it ── */}
      <main className="relative z-10 flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-6 pb-24 pt-10 text-center md:px-12">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: ease.out }}
          className="t-section flex items-center gap-4 text-crimson max-[360px]:tracking-[0.18em]"
        >
          <span aria-hidden="true" className="hidden h-px w-14 bg-signal sm:block" />
          <span className="whitespace-nowrap">The action network for doers</span>
          <span aria-hidden="true" className="hidden h-px w-14 bg-signal sm:block" />
        </motion.p>

        <h1
          aria-label={`${FINAL[0]} ${FINAL[1]}`}
          className="t-display mt-8 min-h-[1.95em] text-[clamp(38px,10.4vw,64px)] leading-[0.96] tracking-[-0.045em] text-ink max-[360px]:text-[9vw] md:text-[clamp(64px,7.4vw,120px)]"
        >
          <span aria-hidden="true">
            <span className="block">
              {lines[0]}
              {typing && <Caret />}
            </span>
            <span className="block text-crimson">
              {lines[1]}
              {!typing && <Caret blink={done} />}
            </span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1, ease: ease.out }}
          className="mx-auto mt-8 max-w-[520px] text-[17px] font-light leading-relaxed text-ink-2 md:text-[19px]"
        >
          A private, campus-only network for builders, founders and creators who finish what they start. Post a mission, lock in with people near you, and prove you showed up.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1, ease: ease.out }}
          className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center"
        >
          <Magnetic onClick={onSignup} className="btn-primary group h-14 px-10">
            Get started
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Magnetic>
          <Magnetic onClick={onLogin} className="btn-ghost h-14 border-ink/20 px-10 text-ink-2">
            I have an account
          </Magnetic>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 1 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
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

        {/* Quiet scroll cue */}
        <motion.a
          href="#how"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1 }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
        >
          <span className="t-label transition-colors hover:text-ink">How it works</span>
          <span aria-hidden="true" className="relative h-10 w-px overflow-hidden bg-line">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-signal"
              animate={reduce ? undefined : { y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: ease.inOut }}
            />
          </span>
        </motion.a>
      </main>

      {/* ── How it works ── */}
      <section id="how" aria-labelledby="loop-title" className="relative z-10 border-t border-line">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-12 lg:py-28">
          <h2 id="loop-title" className="t-section text-crimson">
            How it works
          </h2>
          <ol className="mt-10 grid md:grid-cols-3">
            {LOOP.map((item, i) => (
              <motion.li
                key={item.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.12, duration: 0.8, ease: ease.out }}
                className="group relative border-t border-line py-8 md:border-l md:border-t-0 md:px-8 md:py-4 md:first:border-l-0 md:first:pl-0"
              >
                <span className="t-display tabular text-[56px] leading-none text-crimson">{item.n}</span>
                <h3 className="mt-6 text-title-2 text-ink">{item.title}</h3>
                <p className="mt-2 max-w-[320px] text-body font-light text-ink-2">{item.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex flex-col gap-3 border-t border-line px-6 py-7 md:flex-row md:items-center md:justify-between md:px-12 lg:px-20">
        <p className="t-label">LOCKIN — The action network for doers</p>
        <a
          href="https://instagram.com/lockin.top"
          target="_blank"
          rel="noopener noreferrer"
          className="t-label normal-case tracking-[0.12em] transition-colors hover:text-crimson"
        >
          @lockin.top
        </a>
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
