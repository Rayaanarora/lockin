"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { Download, Share2, Check, BookOpen, Quote, Trash2, X, MessageCircle } from "lucide-react";
import { LockinMark, LockinWordmark } from "./ui/LockinLogo";
import { CountUp, Portal } from "./ui/motion";
import { POINTS_NAME } from "../lib/brand";
import { toPng } from "html-to-image";

interface RecapProps {
  isOpen: boolean;
  onClose: () => void;
  recapData: {
    id?: number;
    recapType?: string;
    shareId?: string;
    sessionDuration?: number;
    tasksCompleted?: number;
    topCategory?: string;
    categorySnapshot?: string;
    missionTitle?: string;
    missionName?: string;
    streak?: number;
    currentStreak?: number;
    rank?: number;
    missionRank?: number;
    missionsCompleted?: number;
    longestSession?: number;
    generatedAt?: string;
    reflectionText?: string;
    lessonsLearned?: string;
    metadata?: {
      isFailed?: boolean;
      screenshot?: string | null;
      link?: string | null;
      [key: string]: any;
    };
  };
}

const SHARDS = [
  { clip: "polygon(0% 0%, 50% 0%, 25% 35%, 0% 25%)", tx: -200, ty: -200, r: -180 },
  { clip: "polygon(50% 0%, 100% 0%, 75% 30%, 25% 35%)", tx: 150, ty: -240, r: 160 },
  { clip: "polygon(0% 25%, 25% 35%, 15% 60%, 0% 60%)", tx: -250, ty: -40, r: -110 },
  { clip: "polygon(25% 35%, 75% 30%, 60% 65%, 15% 60%)", tx: 40, ty: 140, r: 280 },
  { clip: "polygon(75% 30%, 100% 0%, 100% 50%, 60% 65%)", tx: 250, ty: -90, r: 210 },
  { clip: "polygon(0% 60%, 15% 60%, 35% 100%, 0% 100%)", tx: -180, ty: 250, r: -220 },
  { clip: "polygon(15% 60%, 60% 65%, 75% 100%, 35% 100%)", tx: -30, ty: 320, r: 420 },
  { clip: "polygon(60% 65%, 100% 50%, 100% 100%, 75% 100%)", tx: 200, ty: 220, r: 230 },
];

export default function LockinRecapCard({
  isOpen,
  onClose,
  recapData,
}: RecapProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);

  // 3D Tilt properties
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const mouseXSpring = useSpring(tiltX, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(tiltY, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const translateX = useTransform(mouseXSpring, [-0.5, 0.5], ["-8px", "8px"]);
  const translateY = useTransform(mouseYSpring, [-0.5, 0.5], ["8px", "-8px"]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], [0, 100]);
  const glareBackgroundFront = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.22) 10%, rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0) 80%)`;
  const glareBackgroundBack = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.18) 10%, rgba(255, 255, 255, 0.06) 30%, rgba(255, 255, 255, 0) 80%)`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    tiltX.set(mouseX / width - 0.5);
    tiltY.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const {
    recapType = "session",
    sessionDuration = 0,
    tasksCompleted = 0,
    generatedAt,
    reflectionText,
    lessonsLearned,
  } = recapData;

  const isFailed = recapData.metadata?.isFailed || false;
  const screenshot = recapData.metadata?.screenshot || null;
  const link = recapData.metadata?.link || null;

  useEffect(() => {
    if (isOpen) {
      setIsTrashing(false);
    }
  }, [isOpen]);

  const streakVal = recapData.streak !== undefined ? recapData.streak : (recapData.currentStreak !== undefined ? recapData.currentStreak : 0);
  const categoryVal = recapData.categorySnapshot || recapData.topCategory || "None";

  const isPeriod = recapType !== "session";

  let statusText = isFailed ? "RUNWAY CRASHED" : "LOCKED IN";
  let subtitleText = recapData.missionTitle || recapData.missionName || "Focus Session";

  if (isFailed) {
    statusText = "RUNWAY CRASHED";
  } else if (isPeriod) {
    if (recapType === "weekly") {
      statusText = "WEEKLY WRAPPED";
      subtitleText = "Weekly Progress Run";
    } else if (recapType === "monthly") {
      statusText = "MONTHLY WRAPPED";
      subtitleText = "Monthly Progress Run";
    } else if (recapType === "yearly") {
      statusText = "YEARLY WRAPPED";
      subtitleText = "Yearly Progress Run";
    } else if (recapType === "team") {
      statusText = "TEAM WRAPPED";
      subtitleText = "Team Progress Run";
    }
  }

  const hours = Math.floor(sessionDuration / 60);
  const mins = sessionDuration % 60;

  const longestDuration = isPeriod ? (recapData.longestSession ?? 0) : sessionDuration;
  const longestHrs = Math.floor(longestDuration / 60);
  const longestMins = longestDuration % 60;
  const longestLockText = `${longestHrs}h ${longestMins}m`;

  const date = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // Calculate tier details
  let tier = "bronze";
  let tierName = "Bronze";
  let tierColor = "rgb(var(--ink-3))"; // Bronze/Copper
  let cardBg = "rgb(var(--surface))";
  let accentColor = "text-ink-3";
  let borderStyle = "border-line";
  let glowColor = "transparent";
  let badgeBg = "bg-surface border-line text-ink-2";

  if (isFailed) {
    tier = "crashed";
    tierName = "Crashed";
    tierColor = "rgb(var(--crimson-text))"; // Red
    cardBg = "rgb(var(--surface))";
    accentColor = "text-crimson";
    borderStyle = "border-signal/70";
    glowColor = "transparent";
    badgeBg = "bg-surface border-signal/70 text-ink";
  } else if (recapType === "session") {
    if (sessionDuration >= 120) {
      tier = "legendary";
      tierName = "Legendary";
      tierColor = "rgb(var(--crimson-text))"; // Red
      cardBg = "rgb(var(--surface))";
      accentColor = "text-crimson";
      borderStyle = "border-signal/70";
      glowColor = "transparent";
      badgeBg = "bg-surface border-signal/70 text-ink";
    } else if (sessionDuration >= 60) {
      tier = "gold";
      tierName = "Gold";
      tierColor = "rgb(var(--gold))"; // Gold
      cardBg = "rgb(var(--surface))";
      accentColor = "text-gold";
      borderStyle = "border-ink/40";
      glowColor = "transparent";
      badgeBg = "bg-gold/15 border-gold/30 text-ink";
    } else if (sessionDuration >= 30) {
      tier = "silver";
      tierName = "Silver";
      tierColor = "rgb(var(--ink-2))"; // Silver
      cardBg = "rgb(var(--surface))";
      accentColor = "text-ink-2";
      borderStyle = "border-ink-2/30";
      glowColor = "transparent";
      badgeBg = "bg-ink-2/10 border-ink-2/25 text-ink";
    }
  } else {
    // Wrapped types logic
    if (recapType === "weekly") {
      const focusHrs = sessionDuration / 60;
      if (focusHrs >= 10) {
        tier = "gold";
        tierName = "Gold";
        tierColor = "rgb(var(--gold))";
        cardBg = "rgb(var(--surface))";
        accentColor = "text-gold";
        borderStyle = "border-ink/40";
        glowColor = "transparent";
        badgeBg = "bg-gold/15 border-gold/30 text-ink";
      } else {
        tier = "silver";
        tierName = "Silver";
        tierColor = "rgb(var(--ink-2))";
        cardBg = "rgb(var(--surface))";
        accentColor = "text-ink-2";
        borderStyle = "border-ink-2/30";
        glowColor = "transparent";
        badgeBg = "bg-ink-2/10 border-ink-2/25 text-ink";
      }
    } else if (recapType === "monthly") {
      tier = "gold";
      tierName = "Gold";
      tierColor = "rgb(var(--gold))";
      cardBg = "rgb(var(--surface))";
      accentColor = "text-gold";
      borderStyle = "border-ink/40";
      glowColor = "transparent";
      badgeBg = "bg-gold/15 border-gold/30 text-ink";
    } else {
      // yearly or team
      tier = "legendary";
      tierName = "Legendary";
      tierColor = "rgb(var(--crimson-text))";
      cardBg = "rgb(var(--surface))";
      accentColor = "text-crimson";
      borderStyle = "border-signal/70";
      glowColor = "transparent";
      badgeBg = "bg-surface border-signal/70 text-ink";
    }
  }

  // Handle export (we force capturing the Front card flat)
  const handleSave = useCallback(async () => {
    if (!cardRef.current || saving) return;

    try {
      setSaving(true);
      // Temporarily ensure card is facing front for image export
      const wasFlipped = isFlipped;
      if (wasFlipped) {
        setIsFlipped(false);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `lockin-recap-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      // Restore flip state
      if (wasFlipped) {
        setIsFlipped(true);
      }
    } catch (err: any) {
      console.error("Failed to export card image:", err);
      alert(err.message || "Failed to export PNG image of the recap. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [saving, isFlipped]);

  const handleShare = useCallback(async () => {
    if (!recapData.shareId) {
      alert("No share coordinates generated for this card.");
      return;
    }

    const shareUrl = `${window.location.origin}/recap/${recapData.shareId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "LOCKIN Recap",
          text: `Check out my Lockin productivity recap! I locked in for ${hours}h ${mins}m.`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert(`Here is your share link: ${shareUrl}`);
    }
  }, [recapData.shareId, hours, mins]);

  if (!isOpen) return null;

  const SPARKS = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const d = 150 + (i % 3) * 40;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, gold: i % 2 === 0, delay: 0.45 + (i % 4) * 0.03 };
  });

  const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-3.5">
      <div className="text-[11px] font-semibold text-ink-3">{label}</div>
      <div className="t-display mt-1 truncate text-title-3 text-ink">{value}</div>
    </div>
  );

  return (
    <Portal>
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`${statusText}: ${subtitleText}`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/80 text-ink-2 backdrop-blur transition-colors hover:text-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="relative my-auto flex w-full max-w-[340px] flex-col items-center sm:max-w-[380px]"
        >
          {/* Success sparks */}
          {!isFailed && !isTrashing && (
            <div className="pointer-events-none absolute left-1/2 top-[40%] z-0" aria-hidden="true">
              {SPARKS.map((s, i) => (
                <motion.span
                  key={i}
                  className={`absolute h-1.5 w-1.5 rounded-full ${s.gold ? "bg-gold" : "bg-signal"}`}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0, 1.4, 0.4] }}
                  transition={{ duration: 1.1, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
                  style={{ boxShadow: `0 0 10px ${s.gold ? "rgb(var(--gold))" : "rgb(var(--signal))"}` }}
                />
              ))}
            </div>
          )}

          {/* Shatter on trash */}
          {isTrashing && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-40" style={{ aspectRatio: "9/16" }} aria-hidden="true">
              {SHARDS.map((sh, i) => (
                <motion.div
                  key={i}
                  className={`absolute inset-0 rounded-sm border ${borderStyle}`}
                  style={{ background: cardBg, clipPath: sh.clip }}
                  initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  animate={{ x: sh.tx, y: sh.ty + 300, rotate: sh.r, opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.4, 0, 0.8, 0.6] }}
                  onAnimationComplete={() => {
                    if (i === 0) {
                      onClose();
                      setIsTrashing(false);
                    }
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => setIsFlipped(!isFlipped)}
            initial={{ y: 80, rotateX: 28, opacity: 0, scale: 0.9 }}
            animate={isTrashing ? { opacity: 0, transition: { duration: 0.05 } } : { y: 0, rotateX: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="relative z-10 w-full cursor-pointer select-none"
            style={{ perspective: "1200px", aspectRatio: "9/16", transformPerspective: 1200 }}
            aria-label={isFlipped ? "Show front" : "Show reflection"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsFlipped(!isFlipped);
              }
            }}
          >
            <motion.div style={{ rotateX, rotateY, translateX, translateY, transformStyle: "preserve-3d", width: "100%", height: "100%" }}>
              <div
                style={{
                  transformStyle: "preserve-3d",
                  transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  position: "absolute",
                  width: "100%",
                  height: "100%"
                }}
              >
                {/* ───────── FRONT ───────── */}
                <div
                  ref={cardRef}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-sm border p-7 text-left shadow-lift sm:p-8 ${borderStyle}`}
                  style={{ background: cardBg, position: "absolute", inset: 0, backfaceVisibility: "hidden" }}
                >

                  {/* Deer persona, as a quiet watermark */}
                  <div className="pointer-events-none absolute -bottom-6 -right-10 opacity-[0.07]">
                    <LockinMark size={260} color="rgb(var(--ink))" showTriangle={false} />
                  </div>

                  {/* Crash cracks draw on */}
                  {isFailed && (
                    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      {[
                        "M 0 30 L 25 35 L 35 20 L 50 35 L 55 55 L 45 70 L 60 85 L 50 100",
                        "M 35 20 L 45 10 L 65 5 L 80 15",
                        "M 55 55 L 75 50 L 90 65 L 100 60",
                        "M 25 35 L 15 50 L 0 55",
                        "M 45 70 L 30 80 L 15 75 L 0 90",
                        "M 60 85 L 80 90 L 100 80"
                      ].map((d, i) => (
                        <motion.path
                          key={d}
                          d={d}
                          stroke="rgb(var(--signal))"
                          strokeWidth="0.5"
                          strokeLinecap="round"
                          fill="none"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.35 + i * 0.06, duration: 0.35, ease: "easeOut" }}
                        />
                      ))}
                    </svg>
                  )}

                  {isFailed && (
                    <motion.div
                      initial={{ scale: 2.2, opacity: 0, rotate: -4 }}
                      animate={{ scale: 1, opacity: 1, rotate: -12 }}
                      transition={{ delay: 0.75, type: "spring", stiffness: 500, damping: 18 }}
                      className="pointer-events-none absolute left-1/2 top-[42%] z-30 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 border-signal bg-black/90 px-5 py-2.5 text-center"
                    >
                      <span className="t-display block whitespace-nowrap text-title-1 text-crimson">Runway crashed</span>
                      <span className="mt-0.5 block text-caption font-semibold text-crimson">−5 {POINTS_NAME}</span>
                    </motion.div>
                  )}

                  {/* Brand row */}
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <LockinMark size={22} color="rgb(var(--ink))" />
                      <LockinWordmark size="sm" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-caption font-semibold" style={{ color: tierColor }}>
                        {statusText}
                      </span>
                      <span className="text-caption text-ink-3">{date}</span>
                    </div>
                  </div>

                  {/* Hero */}
                  <div className="relative z-10">
                    <div className="t-display flex items-baseline leading-none text-ink">
                      {hours > 0 && (
                        <>
                          <CountUp value={hours} className="text-[88px] sm:text-[100px]" duration={1.2} />
                          <span className="mr-3 text-[34px]">h</span>
                        </>
                      )}
                      {(mins > 0 || hours === 0) && (
                        <>
                          <CountUp value={mins} className="text-[88px] sm:text-[100px]" duration={1.2} />
                          <span className="text-[34px]">m</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 text-footnote font-semibold" style={{ color: tierColor }}>
                      {tierName} tier
                    </div>
                    <div className="t-display mt-1 line-clamp-2 text-title-2 text-ink-2">{isPeriod ? "Your summary" : subtitleText}</div>
                  </div>

                  {/* Stats */}
                  <div className="relative z-10">
                    <div className="grid grid-cols-2 gap-x-5 border-t border-white/10">
                      <div className="border-b border-white/10"><Stat label="Tasks" value={tasksCompleted} /></div>
                      <div className="border-b border-white/10"><Stat label={isPeriod ? "Missions" : "Streak"} value={isPeriod ? recapData.missionsCompleted ?? 0 : `${streakVal}d`} /></div>
                      <Stat label="Category" value={categoryVal} />
                      <Stat label={isPeriod ? "Longest" : "Rank"} value={isPeriod ? longestLockText : `#${recapData.missionRank ?? recapData.rank ?? 1}`} />
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-caption text-ink-3">
                      <span>lockin.top</span>
                      <span>Tap to flip</span>
                    </div>
                  </div>

                  {/* Glare + one-time sheen */}
                  <motion.div className="pointer-events-none absolute inset-0 z-50 rounded-sm mix-blend-overlay" style={{ background: glareBackgroundFront, opacity: 0.5 }} />
                  <motion.div
                    className="pointer-events-none absolute inset-y-0 z-50 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    initial={{ x: "-120%" }}
                    animate={{ x: "320%" }}
                    transition={{ delay: 0.6, duration: 1.1, ease: "easeInOut" }}
                  />
                </div>

                {/* ───────── BACK ───────── */}
                <div
                  className={`relative flex flex-col overflow-hidden rounded-sm border p-7 text-left shadow-lift sm:p-8 ${borderStyle}`}
                  style={{ background: cardBg, position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <span className="text-footnote font-semibold text-ink">Reflection</span>
                    <span className="rounded-sm border px-2.5 py-0.5 text-[11px] font-semibold" style={{ borderColor: tierColor, color: tierColor }}>
                      {tierName}
                    </span>
                  </div>

                  <div className="relative z-10 my-5 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-none">
                    {isFailed && (
                      <div className="rounded-xl border border-signal/70 bg-surface p-3.5">
                        <p className="text-headline text-crimson">Crash logged</p>
                        <p className="mt-0.5 text-footnote text-ink-2">Left early with nothing done. 5 {POINTS_NAME} lost.</p>
                      </div>
                    )}
                    {reflectionText && (
                      <div>
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3">
                          <Quote className="h-3.5 w-3.5" style={{ color: tierColor }} /> How it went
                        </p>
                        <p className="mt-2 text-subhead leading-relaxed text-ink">&ldquo;{reflectionText}&rdquo;</p>
                      </div>
                    )}
                    {lessonsLearned && (
                      <div>
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-3">
                          <BookOpen className="h-3.5 w-3.5" style={{ color: tierColor }} /> Next time
                        </p>
                        <p className="mt-2 text-subhead leading-relaxed text-ink-2">{lessonsLearned}</p>
                      </div>
                    )}
                    {screenshot && (
                      <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                        <img src={screenshot} alt="Session proof" className="h-full w-full object-cover" />
                      </div>
                    )}
                    {link && (
                      <a
                        href={link.startsWith("http") ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-subhead text-gold transition-colors hover:bg-black/60"
                      >
                        {link}
                      </a>
                    )}
                    {!reflectionText && !lessonsLearned && !screenshot && !link && !isFailed && (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <LockinMark size={80} color={tierColor} />
                        <p className="t-display mt-5 text-title-2 text-ink">Showed up.</p>
                        <p className="mt-1 text-subhead text-ink-3">No notes this time.</p>
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-caption text-ink-3">
                    <span className="tabular">#{recapData.shareId ? recapData.shareId.slice(0, 8) : "lockin"}</span>
                    <span>Tap to flip</span>
                  </div>
                  <motion.div className="pointer-events-none absolute inset-0 z-50 rounded-sm mix-blend-overlay" style={{ background: glareBackgroundBack, opacity: 0.4 }} />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isTrashing ? { opacity: 0 } : { opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 26 }}
            className="relative z-10 mt-5 flex w-full gap-2"
          >
            {isFailed ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsTrashing(true)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-signal/70 bg-surface text-subhead font-semibold text-ink transition-colors hover:bg-signal/25"
              >
                <Trash2 className="h-[18px] w-[18px]" /> Trash card
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleSave}
                disabled={saving}
                className="btn-primary h-12 flex-1"
              >
                <Download className="h-[18px] w-[18px]" />
                {saving ? "Saving" : "Save image"}
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const text = `*${subtitleText}* on LOCKIN\n${statusText} · ${hours > 0 ? `${hours}h ` : ""}${mins}m locked in${tasksCompleted ? ` · ${tasksCompleted} tasks` : ""}${streakVal ? ` · ${streakVal}-day streak` : ""}\n\nLock in: ${typeof window !== "undefined" ? window.location.origin : ""}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
              }}
              aria-label="Share on WhatsApp"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] transition-colors hover:bg-[#25D366]/20"
            >
              <MessageCircle className="h-5 w-5" />
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              aria-label={copied ? "Link copied" : "Copy share link"}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-2 transition-colors hover:text-ink"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={copied ? "ok" : "share"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex">
                  {copied ? <Check className="h-5 w-5 text-success" /> : <Share2 className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    </Portal>
  );
}
