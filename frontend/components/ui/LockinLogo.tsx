"use client";

import React from "react";

interface StagEmblemProps {
  size?: number;
  className?: string;
  color?: string;
  showTriangle?: boolean;
}

export const StagEmblem: React.FC<StagEmblemProps> = ({
  size = 28,
  className = "",
  color = "currentColor",
  showTriangle = true,
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central Spire */}
      <line x1="100" y1="185" x2="100" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Antler branch pairs */}
      <path d="M100,88 Q68,68 40,56" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M78,77 Q55,52 20,55" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M58,64 Q42,38 8,36" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M44,57 Q28,30 14,20" stroke={color} strokeWidth="3" strokeLinecap="round" />

      <path d="M100,88 Q132,68 160,56" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M122,77 Q145,52 180,55" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M142,64 Q158,38 192,36" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M156,57 Q172,30 186,20" stroke={color} strokeWidth="3" strokeLinecap="round" />

      {/* Crimson Apex Crown Triangle */}
      {showTriangle && (
        <polygon points="100,40 92,54 108,54" fill="#D2042D" />
      )}
    </svg>
  );
};

interface LockinLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
}

export const LockinLogo: React.FC<LockinLogoProps> = ({
  size = "md",
  className = "",
  showSubtitle = false,
}) => {
  const iconSize = {
    sm: 18,
    md: 24,
    lg: 32,
    xl: 44,
  }[size];

  const textSize = {
    sm: "text-[14px] tracking-[0.14em]",
    md: "text-[18px] tracking-[0.16em]",
    lg: "text-[24px] tracking-[0.18em]",
    xl: "text-[32px] tracking-[0.2em]",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex items-center justify-center rounded-xl bg-white/[0.04] p-1.5 border border-white/[0.08] shadow-[0_0_16px_rgba(210,4,45,0.18)]">
        <StagEmblem size={iconSize} color="#EDEBDE" showTriangle={true} />
      </div>
      <div className="flex flex-col">
        <span className={`font-black font-mono text-white ${textSize} leading-none`}>
          L<span className="text-[#D2042D]">O</span>CKIN
        </span>
        {showSubtitle && (
          <span className="text-[8px] font-bold tracking-[0.25em] text-zinc-500 uppercase mt-0.5">
            Campus Network
          </span>
        )}
      </div>
    </div>
  );
};

export default LockinLogo;
