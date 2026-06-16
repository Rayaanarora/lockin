"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Check } from "lucide-react";
import { toPng } from "html-to-image";

interface RecapProps {
  isOpen: boolean;
  onClose: () => void;
  recapData: {
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
  };
}

export default function LockinRecapCard({
  isOpen,
  onClose,
  recapData,
}: RecapProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    recapType = "session",
    sessionDuration = 0,
    tasksCompleted = 0,
    generatedAt,
  } = recapData;

  const streakVal = recapData.streak !== undefined ? recapData.streak : (recapData.currentStreak !== undefined ? recapData.currentStreak : 0);
  const categoryVal = recapData.categorySnapshot || recapData.topCategory || "None";
  
  const isPeriod = recapType !== "session";
  
  let statusText = "LOCKED IN";
  let subtitleText = recapData.missionTitle || recapData.missionName || "Focus Session";
  
  if (isPeriod) {
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

  const handleSave = useCallback(async () => {
    if (!cardRef.current || saving) return;

    try {
      setSaving(true);

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `lockin-recap-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error("Failed to export card image:", err);
      alert(err.message || "Failed to export PNG image of the recap. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [saving]);

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

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[340px] sm:max-w-[420px] my-auto"
        >
          {/* Card Frame */}
          <div
            ref={cardRef}
            className="p-8 sm:p-10 relative overflow-hidden rounded-[28px] border border-white/10 text-left select-none shadow-[0_24px_50px_rgba(0,0,0,0.9)]"
            style={{
              background: "#080808",
              width: "100%",
              aspectRatio: "9/16",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Cyber red accent stripe on the left edge */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F52601]" />

            {/* Ambient Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                   backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)", 
                   backgroundSize: "20px 20px", 
                   backgroundPosition: "0 0, 10px 10px" 
                 }} 
            />

            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-[#F52601]/10 blur-[60px] pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-[#ffffff]/4 blur-[60px] pointer-events-none" />

            {/* Runway graphic lines */}
            <svg className="absolute right-0 bottom-0 w-full h-[55%] opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M-10,100 L110,40" stroke="#F52601" strokeWidth="0.75" strokeDasharray="3 3" fill="none" />
              <path d="M-10,110 L110,50" stroke="#F52601" strokeWidth="1.25" fill="none" />
              <path d="M-10,90 L110,30" stroke="#ffffff" strokeWidth="0.5" fill="none" />
              {/* Radar/sonar arcs */}
              <circle cx="90" cy="90" r="30" stroke="#F52601" strokeWidth="0.5" fill="none" />
              <circle cx="90" cy="90" r="60" stroke="#F52601" strokeWidth="0.5" fill="none" />
              <circle cx="90" cy="90" r="90" stroke="#ffffff" strokeWidth="0.35" fill="none" strokeDasharray="2 2" />
            </svg>

            {/* Top Row: Brand & Badge */}
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-[#F52601]/10 border border-[#F52601]/25">
                  <img src="/logo.png" alt="Logo" className="h-3.5 w-3.5 object-contain" />
                </div>
                <span className="text-[11px] sm:text-[13px] font-black tracking-[0.25em] text-white">LOCKIN</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[#F52601] font-black text-[9px] sm:text-[10.5px] uppercase tracking-[0.2em] leading-none">
                  {statusText}
                </span>
                <span className="text-[8px] sm:text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{date}</span>
              </div>
            </div>

            {/* Middle Row: Hero Stats */}
            <div className="space-y-1.5 z-10">
              <div className="flex items-baseline gap-1">
                {hours > 0 ? (
                  <>
                    <span className="text-7xl sm:text-8xl font-black tracking-tight text-white leading-none">
                      {hours}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-white leading-none mr-2">h</span>
                    {mins > 0 && (
                      <>
                        <span className="text-7xl sm:text-8xl font-black tracking-tight text-white leading-none">
                          {mins}
                        </span>
                        <span className="text-3xl sm:text-4xl font-black text-white leading-none">m</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-7xl sm:text-8xl font-black tracking-tight text-white leading-none">
                      {mins}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-white leading-none">m</span>
                  </>
                )}
              </div>
              <div className="text-[10px] sm:text-[11.5px] font-black tracking-[0.2em] text-[#F52601] uppercase">
                TOTAL EXECUTION TIME
              </div>
              <div className="text-[9.5px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest line-clamp-1">
                {isPeriod ? "YOUR WEEK IN REVIEW" : subtitleText}
              </div>
            </div>

            {/* Bottom Row: Stats Grid with instrument lines */}
            <div className="z-10">
              <div className="grid grid-cols-2 border-t border-white/10">
                {/* Cell 1: Top Left */}
                <div className="border-r border-b border-white/10 py-4 sm:py-5.5 pr-2 text-left">
                  <div className="text-[8px] sm:text-[9.5px] font-bold tracking-[0.15em] text-zinc-500 uppercase">TASKS COMPLETED</div>
                  <div className="text-[14px] sm:text-[16px] font-black text-white mt-1 leading-tight uppercase">{tasksCompleted} Done</div>
                </div>

                {/* Cell 2: Top Right */}
                <div className="border-b border-white/10 py-4 sm:py-5.5 pl-4 sm:pl-6 text-left">
                  <div className="text-[8px] sm:text-[9.5px] font-bold tracking-[0.15em] text-zinc-500 uppercase">
                    {isPeriod ? "MISSIONS RUN" : "CURRENT STREAK"}
                  </div>
                  <div className="text-[14px] sm:text-[16px] font-black text-white mt-1 leading-tight uppercase">
                    {isPeriod ? `${recapData.missionsCompleted ?? 0} Completed` : `${streakVal} Days`}
                  </div>
                </div>

                {/* Cell 3: Bottom Left */}
                <div className="border-r border-white/10 py-4 sm:py-5.5 pr-2 text-left">
                  <div className="text-[8px] sm:text-[9.5px] font-bold tracking-[0.15em] text-zinc-500 uppercase">TOP CATEGORY</div>
                  <div className="text-[14px] sm:text-[16px] font-black text-white mt-1 leading-tight uppercase truncate">{categoryVal}</div>
                </div>

                {/* Cell 4: Bottom Right */}
                <div className="py-4 sm:py-5.5 pl-4 sm:pl-6 text-left">
                  <div className="text-[8px] sm:text-[9.5px] font-bold tracking-[0.15em] text-zinc-500 uppercase">
                    {isPeriod ? "LONGEST LOCK" : "MISSION RANK"}
                  </div>
                  <div className="text-[14px] sm:text-[16px] font-black text-white mt-1 leading-tight uppercase">
                    {isPeriod ? longestLockText : `#${recapData.missionRank ?? recapData.rank ?? 1}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Branding */}
            <div className="border-t border-white/10 pt-3 sm:pt-4.5 flex justify-between text-[7px] sm:text-[8.5px] font-black text-zinc-500 tracking-[0.25em] uppercase z-10">
              <span>LOCKIN RUNWAY</span>
              <span>SCREENSHOT TO SHARE</span>
            </div>
          </div>

          {/* Action Row below the mockup card */}
          <div className="flex gap-2 mt-4 justify-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#F52601] hover:bg-[#D42000] text-white font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition disabled:opacity-50 tracking-wider uppercase"
            >
              <Download size={13} />
              {saving ? "Exporting..." : "Export"}
            </button>

            <button
              onClick={handleShare}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${
                copied
                  ? "bg-boxRed/10 border-boxRed text-boxRed"
                  : "bg-zinc-950 border-white/8 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
              title={copied ? "Copied!" : "Share Link"}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}