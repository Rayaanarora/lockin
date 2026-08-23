import { useCurrentFrame, useVideoConfig, Audio, AbsoluteFill, spring, interpolate } from "remotion";
import React from "react";

// Font and design configurations
const FONT_SANS = 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FONT_MONO = '"SF Mono", SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace';

const COLORS = {
  black: "#000000",
  offBlack: "#0A0A0C",
  offWhite: "#EDEBDE",
  crimson: "#D2042D",
  gridLine: "rgba(237, 235, 222, 0.05)",
};

// SVG Minimalist Stag Emblem Component
const StagEmblem = ({ size = 200, color = "#FFFFFF", redTriangle = true }) => {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
      {/* Central trunk */}
      <line x1="100" y1="180" x2="100" y2="90" stroke={color} strokeWidth="3" strokeLinecap="round" />
      
      {/* Left Main Antler branch */}
      <path d="M 100 90 Q 70 70 45 60" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Left Sub Antler branches */}
      <path d="M 82 80 Q 62 55 27 58" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 62 67 Q 47 40 12 40" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 47 60 Q 32 35 17 25" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

      {/* Right Main Antler branch */}
      <path d="M 100 90 Q 130 70 155 60" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Right Sub Antler branches */}
      <path d="M 118 80 Q 138 55 173 58" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 138 67 Q 153 40 188 40" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 153 60 Q 168 35 183 25" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Center Red Triangle */}
      {redTriangle && (
        <polygon points="100,45 94,56 106,56" fill={COLORS.crimson} />
      )}
    </svg>
  );
};

// 2D Character Silhouette drawing: Leaning Friend
const LeaningFriend = ({ scale = 1, flip = false, headBob = 0, armAngle = 0 }) => {
  const transform = `scale(${flip ? -scale : scale}, ${scale}) translate(${flip ? -100 : 0}px, 0px)`;
  return (
    <g style={{ transform, transformOrigin: "bottom center" }}>
      {/* Torso/Coat */}
      <path d="M 30,220 C 30,170 45,130 65,115 L 85,115 C 105,130 120,170 120,220 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
      {/* Neck */}
      <rect x="70" y="98" width="10" height="20" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
      {/* Head */}
      <circle cx="75" cy={`80`} r="16" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" style={{ transform: `translateY(${headBob}px)` }} />
      {/* Shoulder/Arm leaning */}
      <path d="M 45,130 Q 30,150 15,160" fill="none" stroke={COLORS.offWhite} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
};

export const Video = ({ musicEnabled = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Helper spring animations
  const spr = (startFrame, duration = 12) => {
    return spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 15 },
    });
  };

  // Helper interpolation
  const val = (startFrame, endFrame, startVal, endVal) => {
    return interpolate(frame, [startFrame, endFrame], [startVal, endVal], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // Camera Pan & Shake Logic (handheld vlogging vibe)
  const cameraScale = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [1.00, 1.03]
  );
  
  const cameraX = interpolate(
    Math.cos(frame * 0.08),
    [-1, 1],
    [-8, 8]
  );

  const cameraY = interpolate(
    Math.sin(frame * 0.06),
    [-1, 1],
    [-6, 6]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* BACKGROUND AUDIO */}
      {musicEnabled && (
        <Audio src={require("./assets/audio/music.wav")} volume={0.8} />
      )}
      
      {/* VOICEOVER PLAY TIMELINE */}
      <Audio src={require("./assets/audio/line1.mp3")} startFrom={0} playAt={0} />       {/* 0.0s */}
      <Audio src={require("./assets/audio/line2.mp3")} startFrom={0} playAt={120} />     {/* 4.0s */}
      <Audio src={require("./assets/audio/line3.mp3")} startFrom={0} playAt={210} />     {/* 7.0s */}
      <Audio src={require("./assets/audio/line4.mp3")} startFrom={0} playAt={300} />     {/* 10.0s */}
      <Audio src={require("./assets/audio/line5.mp3")} startFrom={0} playAt={390} />     {/* 13.0s */}
      <Audio src={require("./assets/audio/line6.mp3")} startFrom={0} playAt={480} />     {/* 16.0s */}
      <Audio src={require("./assets/audio/line7.mp3")} startFrom={0} playAt={630} />     {/* 21.0s */}
      <Audio src={require("./assets/audio/line8.mp3")} startFrom={0} playAt={735} />     {/* 24.5s */}
      <Audio src={require("./assets/audio/line9.mp3")} startFrom={0} playAt={810} />     {/* 27.0s */}

      {/* AUDIO SOUND EFFECTS (SFX) */}
      <Audio src={require("./assets/audio/static_hit.wav")} playAt={120} volume={0.7} />
      <Audio src={require("./assets/audio/tick.wav")} playAt={210} volume={0.6} />
      <Audio src={require("./assets/audio/whoosh.wav")} playAt={230} volume={0.5} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={260} volume={0.6} />
      
      <Audio src={require("./assets/audio/type_click.wav")} playAt={305} volume={0.4} />
      <Audio src={require("./assets/audio/type_click.wav")} playAt={312} volume={0.4} />
      <Audio src={require("./assets/audio/type_click.wav")} playAt={320} volume={0.4} />
      <Audio src={require("./assets/audio/type_click.wav")} playAt={330} volume={0.4} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={350} volume={0.6} />
      
      <Audio src={require("./assets/audio/whoosh.wav")} playAt={390} volume={0.5} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={440} volume={0.6} />
      
      <Audio src={require("./assets/audio/bass_impact.wav")} playAt={480} volume={0.8} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={680} volume={0.6} />
      <Audio src={require("./assets/audio/logo_impact.wav")} playAt={870} volume={1.0} />

      {/* BACKGROUND GLOBAL GRID NODES */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(to right, ${COLORS.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${COLORS.gridLine} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          opacity: 0.3,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* CORE CINEMATIC VIEWPORT CONTAINER */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 5,
          transform: `scale(${cameraScale}) translate(${cameraX}px, ${cameraY}px)`,
        }}
      >
        
        {/* ================================================== */}
        {/* SCENE 1: Rooftop Conversation (0 - 120 frames / 0:00 - 0:04) */}
        {/* ================================================== */}
        {frame >= 0 && frame < 120 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 60px", zIndex: 10 }}>
            {/* Swiss Editorial Top Typography */}
            <div style={{ opacity: spr(5), transform: `translateY(${val(0, 15, -40, 0)}px)` }}>
              <h1 style={{ color: COLORS.offWhite, fontSize: "48px", fontWeight: 900, lineHeight: "1.1", letterSpacing: "-1.5px" }}>
                DOST TOH SABKE PAAS HOTE HAIN.
              </h1>
            </div>

            {/* Character Silhouette Animation */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", position: "relative", marginBottom: "-100px" }}>
              <svg viewBox="0 0 400 300" width="400" height="300" style={{ overflow: "visible" }}>
                {/* Rooftop Railing */}
                <line x1="-100" y1="230" x2="500" y2="230" stroke={COLORS.offWhite} strokeWidth="3" />
                <line x1="-100" y1="250" x2="500" y2="250" stroke={COLORS.offWhite} strokeWidth="2" strokeDasharray="10 10" />
                <line x1="80" y1="230" x2="80" y2="300" stroke={COLORS.offWhite} strokeWidth="2" />
                <line x1="320" y1="230" x2="320" y2="300" stroke={COLORS.offWhite} strokeWidth="2" />

                {/* Friend A (Leaning & speaking) */}
                <g style={{ transform: "translate(60px, 15px) scale(0.95)" }}>
                  <LeaningFriend headBob={Math.sin(frame * 0.15) * 1.5} />
                </g>

                {/* Friend B (Responding) */}
                <g style={{ transform: "translate(220px, 15px) scale(0.95)" }}>
                  <LeaningFriend flip={true} headBob={Math.sin(frame * 0.12) * 1.0} />
                </g>
              </svg>
            </div>

            {/* Subtitle / Second Line */}
            {frame >= 60 && (
              <div style={{ opacity: spr(60), transform: `translateY(${val(60, 75, 40, 0)}px)`, zIndex: 10, textAlign: "center", marginTop: "20px" }}>
                <h1 style={{ color: COLORS.crimson, fontSize: "52px", fontWeight: 950, letterSpacing: "-2px", textShadow: "0 0 20px rgba(210,4,45,0.3)" }}>
                  PAR KARNE WAALE KITNE HAIN?
                </h1>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 2: Side Quest 01 — RUN (120 - 300 frames / 0:04 - 0:10) */}
        {/* ================================================== */}
        {frame >= 120 && frame < 300 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 60px", zIndex: 10 }}>
            {/* Title */}
            <div style={{ transform: `translateY(${val(120, 135, -40, 0)}px)`, opacity: val(120, 130, 0, 1) }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>6:00 AM — RUNWAY</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "52px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>6:00 AM — RUN</h2>
            </div>

            {/* Alarm Clock & Running Silhouette Environment */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {/* 120 - 150: Alarm Clock Zoom */}
              {frame >= 120 && frame < 160 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: `2px solid ${COLORS.crimson}`, boxShadow: `0 0 30px ${COLORS.gridLine}`, borderRadius: "24px", padding: "30px 40px", textAlign: "center", transform: `scale(${interpolate(frame - 120, [0, 30], [1.3, 0.95])})`, opacity: val(120, 130, 0, 1) }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: "54px", fontWeight: 950, color: COLORS.offWhite, letterSpacing: "2px" }}>
                    {frame >= 140 ? "06:00" : "05:59"}
                  </span>
                  <span style={{ display: "block", fontSize: "10px", color: COLORS.crimson, marginTop: "8px", letterSpacing: "3px", fontWeight: 800 }}>ALARM ACTIVATED</span>
                </div>
              )}

              {/* 160 - 300: Running Silhouette & Parallax Street */}
              {frame >= 160 && (
                <svg viewBox="0 0 360 260" width="360" height="260" style={{ overflow: "visible" }}>
                  {/* Horizon line */}
                  <line x1="-100" y1="200" x2="460" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

                  {/* Parallax Street Lights moving left */}
                  <g style={{ opacity: 0.35 }}>
                    <line x1={val(160, 300, 420, -100)} y1="100" x2={val(160, 300, 420, -100)} y2="200" stroke={COLORS.offWhite} strokeWidth="1.5" />
                    <circle cx={val(160, 300, 420, -100)} cy="100" r="5" fill={COLORS.offWhite} />
                    
                    <line x1={val(160, 300, 680, 160)} y1="100" x2={val(160, 300, 680, 160)} y2="200" stroke={COLORS.offWhite} strokeWidth="1.5" />
                    <circle cx={val(160, 300, 680, 160)} cy="100" r="5" fill={COLORS.offWhite} />
                  </g>

                  {/* Runner A (Protagonist) outline */}
                  <g style={{ transform: `translate(100px, ${110 + Math.sin(frame * 0.4) * 3}px) scale(0.65)` }}>
                    {/* Head */}
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    {/* Torso */}
                    <path d="M 50,44 L 35,90 M 50,44 L 65,80" stroke={COLORS.offWhite} strokeWidth="3" strokeLinecap="round" />
                    {/* Legs (Running cycle swing) */}
                    <path d={`M 35,90 L ${45 + Math.sin(frame * 0.3) * 15},130`} stroke={COLORS.offWhite} strokeWidth="3.5" strokeLinecap="round" />
                    <path d={`M 35,90 L ${25 - Math.sin(frame * 0.3) * 15},130`} stroke={COLORS.offWhite} strokeWidth="3.5" strokeLinecap="round" />
                  </g>

                  {/* Runner B (Joins after match at frame 250) */}
                  {frame >= 250 && (
                    <g style={{ transform: `translate(${val(250, 275, -50, 160)}px, ${110 + Math.sin(frame * 0.4 + 1) * 3}px) scale(0.65)`, opacity: val(250, 260, 0, 0.8) }}>
                      {/* Head */}
                      <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="2.5" />
                      {/* Torso */}
                      <path d="M 50,44 L 35,90 M 50,44 L 65,80" stroke={COLORS.crimson} strokeWidth="3" strokeLinecap="round" />
                      {/* Legs */}
                      <path d={`M 35,90 L ${45 + Math.sin(frame * 0.3 + 1.5) * 15},130`} stroke={COLORS.crimson} strokeWidth="3.5" strokeLinecap="round" />
                      <path d={`M 35,90 L ${25 - Math.sin(frame * 0.3 + 1.5) * 15},130`} stroke={COLORS.crimson} strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                  )}

                  {/* Map grid coordinate overlays */}
                  {frame >= 180 && (
                    <g style={{ transform: "translate(40px, 10px)" }}>
                      <text x="0" y="240" fill={COLORS.crimson} fontFamily={FONT_MONO} fontSize="9px" fontWeight="bold" letterSpacing="1px">
                        ROUTE ACTIVE: VANDALUR HEIGHTS
                      </text>
                      <path d="M 0,225 L 260,225" stroke={COLORS.crimson} strokeWidth="1" strokeDasharray="3 3" opacity={0.6} />
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* Locked popup confirmation */}
            {frame >= 260 && (
              <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(260)})`, opacity: spr(260) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", border: `2.5px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "10px 25px", borderRadius: "14px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORS.crimson }} />
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.offWhite, fontSize: "12px", fontWeight: 900, letterSpacing: "2px" }}>LOCKED // RUNNER CONNECTED</span>
                </div>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 3: Side Quest 02 — BUILD (300 - 390 frames / 0:10 - 0:13) */}
        {/* ================================================== */}
        {frame >= 300 && frame < 390 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 60px", zIndex: 10 }}>
            {/* Title */}
            <div style={{ transform: `translateY(${val(300, 315, -40, 0)}px)`, opacity: val(300, 310, 0, 1) }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>LATE NIGHT // SYSTEM</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "52px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>BUILD SOMETHING — TONIGHT</h2>
            </div>

            {/* Workspace & Interactive Node Assembler */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg viewBox="0 0 340 260" width="340" height="260" style={{ overflow: "visible" }}>
                {/* Coding layout node blocks */}
                {frame >= 308 && (
                  <rect x="20" y="30" width="100" height="60" rx="10" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                )}
                {frame >= 318 && (
                  <rect x="220" y="30" width="100" height="60" rx="10" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                )}
                {frame >= 328 && (
                  <rect x="120" y="150" width="100" height="60" rx="10" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                )}

                {/* Grid connections mapping */}
                {frame >= 335 && (
                  <line x1="120" y1="60" x2="220" y2="60" stroke={COLORS.crimson} strokeWidth="2.5" strokeDasharray="4 4" />
                )}
                {frame >= 342 && (
                  <line x1="70" y1="90" x2="120" y2="180" stroke={COLORS.crimson} strokeWidth="2.5" strokeDasharray="4 4" />
                )}
                {frame >= 348 && (
                  <line x1="270" y1="90" x2="220" y2="180" stroke={COLORS.crimson} strokeWidth="2.5" strokeDasharray="4 4" />
                )}

                {/* Developer silhouettes inside card nodes */}
                {frame >= 310 && (
                  <g style={{ transform: "translate(45px, 40px) scale(0.25)" }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,90 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  </g>
                )}

                {/* Programmer B joins inside nodes */}
                {frame >= 350 && (
                  <g style={{ transform: "translate(145px, 160px) scale(0.25)", opacity: val(350, 360, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,90 H 80 Z" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="2.5" />
                  </g>
                )}
              </svg>

              {/* Stack stuck notification overlay */}
              {frame >= 320 && frame < 350 && (
                <div style={{ position: "absolute", bottom: "10px", background: "#0A0A0C", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 20px", borderRadius: "12px", textAlign: "center", animation: "pulse 1.5s infinite" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: COLORS.offWhite }}>DEV PROCESS: STUCK ON PARSING</span>
                </div>
              )}
            </div>

            {/* Notification Bubble from LOCKIN */}
            {frame >= 350 && (
              <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(350)})`, opacity: spr(350) }}>
                <div style={{ display: "inline-flex", flexDirection: "column", gap: "5px", border: `2.5px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "12px 25px", borderRadius: "14px", textAlign: "center" }}>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "10px", fontWeight: 800, letterSpacing: "2px" }}>MESSAGE RECEIVE</span>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: COLORS.offWhite }}>"Bhai... aaj woh idea banaate hain?"</span>
                </div>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 4: Side Quest 03 — TREK (390 - 480 frames / 0:13 - 0:16) */}
        {/* ================================================== */}
        {frame >= 390 && frame < 480 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 60px", zIndex: 10 }}>
            {/* Title */}
            <div style={{ transform: `translateY(${val(390, 405, -40, 0)}px)`, opacity: val(390, 395, 0, 1) }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>WEEKEND // ALTITUDE</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "52px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>WEEKEND — SIDE QUEST</h2>
            </div>

            {/* Mountain Parallax Contour Ascent */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg viewBox="0 0 340 280" width="340" height="280" style={{ overflow: "visible" }}>
                {/* Background mountain silhouette layer */}
                <path d="M -50,280 L 120,130 L 280,240 L 400,120 L 500,280 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                
                {/* Foreground mountain paths (moving left for climb feel) */}
                <path
                  d="M 40,280 Q 110,220 170,180 T 260,110"
                  fill="none"
                  stroke={COLORS.offWhite}
                  strokeWidth="2.5"
                  strokeDasharray="300"
                  strokeDashoffset={interpolate(frame - 400, [0, 60], [300, 0], { extrapolateRight: "clamp" })}
                />

                {/* STAG Waypoint beacon */}
                {frame >= 440 && (
                  <g style={{ transform: `translate(230px, 40px) scale(0.25)`, opacity: val(440, 455, 0, 1) }}>
                    <StagEmblem size={150} color={COLORS.crimson} redTriangle={false} />
                  </g>
                )}

                {/* Hiker line-art silhouettes climbing */}
                {frame >= 420 && (
                  <g style={{ transform: `translate(${val(410, 470, 40, 200)}px, ${val(410, 470, 260, 160)}px) scale(0.55)` }}>
                    {/* Head */}
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    {/* Backpack */}
                    <rect x="22" y="44" width="16" height="30" rx="4" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2" />
                    {/* Torso */}
                    <path d="M 50,44 L 35,90 M 50,44 L 65,80" stroke={COLORS.offWhite} strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
              </svg>
            </div>

            {/* Locked Badge */}
            {frame >= 440 && (
              <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(440)})`, opacity: spr(440) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", border: `2.5px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "10px 25px", borderRadius: "14px" }}>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.offWhite, fontSize: "12px", fontWeight: 900, letterSpacing: "2px" }}>5/6 LOCKED ON ROAD</span>
                </div>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 5: Scooter Night Ride (480 - 570 frames / 0:16 - 0:19) */}
        {/* ================================================== */}
        {frame >= 480 && frame < 570 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 60px", zIndex: 10 }}>
            {/* Title */}
            <div style={{ transform: `translateY(${val(480, 495, -40, 0)}px)`, opacity: val(480, 490, 0, 1) }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>MIDNIGHT // ROAD RUN</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "52px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>FRIENDS FOR YOUR WILDEST SIDE QUESTS.</h2>
            </div>

            {/* Scooter silhouette cutting through city grid */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg viewBox="0 0 340 260" width="340" height="260" style={{ overflow: "visible" }}>
                {/* Horizontal road lines sweeping */}
                <line x1="-100" y1="180" x2="440" y2="180" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                <line x1={val(480, 570, 400, -100)} y1="180" x2={val(480, 570, 480, -20)} y2="180" stroke={COLORS.crimson} strokeWidth="3" />

                {/* Scooter riders silhouette */}
                <g style={{ transform: `translate(80px, ${100 + Math.sin(frame * 0.5) * 2}px) scale(0.75)` }}>
                  {/* Headlight cone glow */}
                  <polygon points="120,60 280,10 280,120" fill="rgba(255, 255, 255, 0.08)" />

                  {/* Scooter wheels */}
                  <circle cx="30" cy="70" r="16" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  <circle cx="110" cy="70" r="16" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  
                  {/* Scooter frame */}
                  <path d="M 30,70 L 60,65 L 110,70 M 110,70 L 100,30 L 80,30" fill="none" stroke={COLORS.offWhite} strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Rider A (Driver) */}
                  <circle cx="65" cy="15" r="10" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  <path d="M 65,25 C 65,35 70,55 60,65" stroke={COLORS.offWhite} strokeWidth="3.5" strokeLinecap="round" />

                  {/* Rider B (Pillion back passenger) */}
                  <circle cx="45" cy="10" r="10" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  <path d="M 45,20 C 45,30 50,50 40,60" stroke={COLORS.offWhite} strokeWidth="3.5" strokeLinecap="round" />
                </g>
              </svg>
            </div>

            {/* Campaign tag */}
            <div style={{ display: "flex", justifyContent: "center", opacity: val(500, 520, 0, 1) }}>
              <span style={{ fontFamily: FONT_MONO, color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 700, letterSpacing: "3px" }}>
                SPONTANEOUS MIDNIGHT EXPLORATION
              </span>
            </div>
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 6: Convergence & Actual Meeting (570 - 720 frames / 0:19 - 0:24) */}
        {/* ================================================== */}
        {frame >= 570 && frame < 720 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "100px 60px", zIndex: 10 }}>
            {/* Title */}
            <div style={{ transform: `translateY(${val(570, 585, -40, 0)}px)`, opacity: val(570, 575, 0, 1) }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>ACTUAL MEETING // LIVE</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "52px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>FIND YOUR PEOPLE.</h2>
            </div>

            {/* Meeting in person at Campus Tea Stall */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", position: "relative", marginBottom: "-80px" }}>
              <svg viewBox="0 0 360 260" width="360" height="260" style={{ overflow: "visible" }}>
                {/* Tea Stall Counter */}
                <rect x="40" y="160" width="280" height="100" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                <line x1="80" y1="160" x2="80" y2="100" stroke={COLORS.offWhite} strokeWidth="2" />
                <line x1="280" y1="160" x2="280" y2="100" stroke={COLORS.offWhite} strokeWidth="2" />
                <line x1="80" y1="100" x2="280" y2="100" stroke={COLORS.offWhite} strokeWidth="2" />
                
                {/* Glow Sign - TEA */}
                {frame % 10 < 7 ? (
                  <rect x="140" y="110" width="80" height="30" rx="4" fill="rgba(210,4,45,0.1)" stroke={COLORS.crimson} strokeWidth="1.5" />
                ) : (
                  <rect x="140" y="110" width="80" height="30" rx="4" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                )}
                <text x="180" y="130" textAnchor="middle" fill={frame % 10 < 7 ? COLORS.crimson : "rgba(255,255,255,0.1)"} fontFamily={FONT_MONO} fontSize="12px" fontWeight="black" letterSpacing="4px">TEA</text>

                {/* Silhouettes gathering (fade in sequentially) */}
                {frame >= 600 && (
                  <g style={{ transform: "translate(60px, 60px) scale(0.55)", opacity: val(600, 615, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  </g>
                )}

                {frame >= 620 && (
                  <g style={{ transform: "translate(110px, 60px) scale(0.55)", opacity: val(620, 635, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  </g>
                )}

                {frame >= 640 && (
                  <g style={{ transform: "translate(200px, 60px) scale(0.55)", opacity: val(640, 655, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  </g>
                )}

                {frame >= 660 && (
                  <g style={{ transform: "translate(250px, 60px) scale(0.55)", opacity: val(660, 675, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="2.5" />
                  </g>
                )}
              </svg>
            </div>

            {/* Product UI Slots Card: CREATE, JOIN, SHOW UP */}
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "14px", opacity: val(670, 690, 0, 1) }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "20px", fontWeight: 900, color: COLORS.offWhite }}>CREATE. JOIN. SHOW UP.</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: "10px", color: COLORS.crimson }}>LOCKED VERIFIED</span>
              </div>
            </div>
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 7: Outro Narrative Loop & Logo Hit (720 - 1050 frames / 0:24 - 0:35) */}
        {/* ================================================== */}
        {frame >= 720 && (
          <AbsoluteFill
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "100px 60px",
              backgroundColor: COLORS.black,
              zIndex: 100,
              // Smooth fade-in from the meeting scene
              opacity: interpolate(frame, [720, 740], [0, 1], { extrapolateLeft: "clamp" }),
            }}
          >
            {/* 720 - 870: Dialogue Space (Narrative Rooftop Loop) */}
            {frame < 870 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                {/* Headline Question placeholder */}
                <div style={{ opacity: 0.8 }}>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "12px", fontWeight: 700, letterSpacing: "4px" }}>EPILOGUE // THE LOOP</span>
                </div>

                {/* Subtle loop of the two rooftop friends from Scene 1 */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: "200px" }}>
                  <svg viewBox="0 0 400 200" width="300" height="150" style={{ overflow: "visible" }}>
                    <line x1="-100" y1="180" x2="500" y2="180" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                    <g style={{ transform: "translate(100px, 30px) scale(0.65)", opacity: 0.6 }}>
                      <LeaningFriend headBob={Math.sin(frame * 0.1) * 1.0} />
                    </g>
                    <g style={{ transform: "translate(200px, 30px) scale(0.65)", flip: true, opacity: 0.6 }}>
                      <LeaningFriend flip={true} headBob={Math.sin(frame * 0.08) * 1.0} />
                    </g>
                  </svg>
                </div>

                {/* Subtitle speech card */}
                <div style={{ height: "100px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {frame >= 735 && frame < 810 && (
                    <span style={{ color: COLORS.offWhite, fontSize: "32px", fontWeight: 700, textAlign: "center", opacity: val(735, 750, 0, 0.8) }}>
                      “Jeevan saathi ka pata nahi…”
                    </span>
                  )}
                  {frame >= 810 && (
                    <span style={{ color: COLORS.crimson, fontSize: "36px", fontWeight: 900, textAlign: "center", opacity: val(810, 825, 0, 1), textShadow: "0 0 20px rgba(210,4,45,0.3)" }}>
                      “Abhi ka saathi mil jayega.”
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 870 - 1050: Explosive LOGO HIT */}
            {frame >= 870 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "45px",
                  transform: `scale(${interpolate(frame - 870, [0, 12], [1.3, 1.0], { extrapolateRight: "clamp" })})`,
                }}
              >
                {/* Minimal line-art Stag emblem */}
                <StagEmblem size={260} />

                {/* Bold typographic LOGO: LOCKIN */}
                <h1
                  style={{
                    fontSize: "96px",
                    fontWeight: 950,
                    letterSpacing: "10px",
                    color: COLORS.offWhite,
                    display: "flex",
                    alignItems: "center",
                    lineHeight: "1.0",
                    marginLeft: "10px",
                  }}
                >
                  L<span style={{ color: COLORS.crimson }}>O</span>CKIN
                </h1>

                {/* Tagline: FIND YOUR PEOPLE */}
                {frame >= 900 && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: FONT_MONO,
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "6px",
                      textTransform: "uppercase",
                      marginTop: "-5px",
                      opacity: interpolate(frame, [900, 930], [0, 1], { extrapolateLeft: "clamp" }),
                    }}
                  >
                    FIND YOUR PEOPLE.
                  </span>
                )}
              </div>
            )}
          </AbsoluteFill>
        )}

      </div>
    </AbsoluteFill>
  );
};
