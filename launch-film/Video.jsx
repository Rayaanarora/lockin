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
      <line x1="100" y1="180" x2="100" y2="90" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Left Main Antler branch */}
      <path d="M 100 90 Q 70 70 45 60" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      {/* Left Sub Antler branches */}
      <path d="M 82 80 Q 62 55 27 58" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M 62 67 Q 47 40 12 40" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M 47 60 Q 32 35 17 25" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />

      {/* Right Main Antler branch */}
      <path d="M 100 90 Q 130 70 155 60" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      {/* Right Sub Antler branches */}
      <path d="M 118 80 Q 138 55 173 58" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M 138 67 Q 153 40 188 40" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M 153 60 Q 168 35 183 25" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      
      {/* Center Red Triangle */}
      {redTriangle && (
        <polygon points="100,45 94,56 106,56" fill={COLORS.crimson} />
      )}
    </svg>
  );
};

// 2D Character Silhouette: Leaning Friend
const LeaningFriend = ({ scale = 1, flip = false, headBob = 0 }) => {
  const transform = `scale(${flip ? -scale : scale}, ${scale}) translate(${flip ? -100 : 0}px, 0px)`;
  return (
    <g style={{ transform, transformOrigin: "bottom center" }}>
      {/* Torso */}
      <path d="M 30,220 C 30,165 45,125 65,110 L 85,110 C 105,125 120,165 120,220 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
      {/* Neck */}
      <rect x="70" y="94" width="10" height="20" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
      {/* Head */}
      <circle cx="75" cy="76" r="16" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" style={{ transform: `translateY(${headBob}px)` }} />
      {/* Leaning Arm */}
      <path d="M 45,125 Q 28,145 12,155" fill="none" stroke={COLORS.offWhite} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
};

export const Video = ({ musicEnabled = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Helper spring animation curves
  const spr = (startFrame, duration = 12) => {
    return spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 15 },
    });
  };

  // Helper interpolation curves
  const val = (startFrame, endFrame, startVal, endVal) => {
    return interpolate(frame, [startFrame, endFrame], [startVal, endVal], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // Subtle handheld camera drift (cinematographic texture)
  const cameraScale = interpolate(Math.sin(frame * 0.04), [-1, 1], [1.00, 1.04]);
  const cameraX = interpolate(Math.cos(frame * 0.07), [-1, 1], [-6, 6]);
  const cameraY = interpolate(Math.sin(frame * 0.05), [-1, 1], [-4, 4]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* COMPOSITION GUIDES (Subtle background grid aligned with 4:5 frame) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(to right, ${COLORS.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${COLORS.gridLine} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          opacity: 0.25,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* AUDIO COMPOSITION TIMINGS */}
      {musicEnabled && (
        <Audio src={require("./assets/audio/music.wav")} volume={0.8} />
      )}
      
      {/* Voiceover cues */}
      <Audio src={require("./assets/audio/line1.mp3")} startFrom={0} playAt={0} />
      <Audio src={require("./assets/audio/line2.mp3")} startFrom={0} playAt={120} />
      <Audio src={require("./assets/audio/line3.mp3")} startFrom={0} playAt={210} />
      <Audio src={require("./assets/audio/line4.mp3")} startFrom={0} playAt={300} />
      <Audio src={require("./assets/audio/line5.mp3")} startFrom={0} playAt={390} />
      <Audio src={require("./assets/audio/line6.mp3")} startFrom={0} playAt={480} />
      <Audio src={require("./assets/audio/line7.mp3")} startFrom={0} playAt={630} />
      <Audio src={require("./assets/audio/line8.mp3")} startFrom={0} playAt={735} />
      <Audio src={require("./assets/audio/line9.mp3")} startFrom={0} playAt={810} />

      {/* Sound effects */}
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

      {/* CAMERA INNER VIEWPORT CONTAINER */}
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
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "80px 100px", zIndex: 10 }}>
            {/* Massive Campaign Text (occupying ~75% width) */}
            <div style={{ opacity: spr(5), transform: `translateY(${val(0, 15, -30, 0)}px)`, width: "90%", margin: "0 auto" }}>
              <h1 style={{ color: COLORS.offWhite, fontSize: "70px", fontWeight: 950, lineHeight: "1.05", letterSpacing: "-3px", textAlign: "center" }}>
                DOST TOH SABKE PAAS HOTE HAIN.
              </h1>
            </div>

            {/* Centered Rooftop Scene */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", position: "relative", marginBottom: "-80px" }}>
              <svg viewBox="0 0 500 300" width="500" height="300" style={{ overflow: "visible" }}>
                {/* Parallax Skyline Outlines */}
                <g style={{ opacity: 0.15, transform: `translateX(${val(0, 120, 20, -20)}px)` }}>
                  <rect x="40" y="100" width="60" height="200" fill="none" stroke={COLORS.offWhite} strokeWidth="2" />
                  <rect x="120" y="70" width="80" height="230" fill="none" stroke={COLORS.offWhite} strokeWidth="2" />
                  <rect x="220" y="120" width="70" height="180" fill="none" stroke={COLORS.offWhite} strokeWidth="2" />
                  <rect x="310" y="50" width="90" height="250" fill="none" stroke={COLORS.offWhite} strokeWidth="2" />
                </g>

                {/* Handrail */}
                <line x1="-50" y1="230" x2="550" y2="230" stroke={COLORS.offWhite} strokeWidth="3" />
                <line x1="-50" y1="250" x2="550" y2="250" stroke={COLORS.offWhite} strokeWidth="2" strokeDasharray="8 8" opacity={0.4} />

                {/* Characters (framed in the bottom center) */}
                <g style={{ transform: "translate(110px, 15px) scale(0.95)" }}>
                  <LeaningFriend headBob={Math.sin(frame * 0.14) * 1.5} />
                </g>
                <g style={{ transform: "translate(270px, 15px) scale(0.95)" }}>
                  <LeaningFriend flip={true} headBob={Math.sin(frame * 0.11) * 1.0} />
                </g>
              </svg>
            </div>

            {/* Second Dialogue Response Line */}
            {frame >= 60 && (
              <div style={{ opacity: spr(60), transform: `translateY(${val(60, 75, 30, 0)}px)`, width: "90%", margin: "0 auto", zIndex: 10, textAlign: "center" }}>
                <h1 style={{ color: COLORS.crimson, fontSize: "70px", fontWeight: 950, letterSpacing: "-3px", lineHeight: "1.05", textShadow: "0 0 25px rgba(210,4,45,0.4)" }}>
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
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "80px 100px", zIndex: 10 }}>
            {/* Large Top Heading */}
            <div style={{ transform: `translateY(${val(120, 135, -30, 0)}px)`, opacity: val(120, 130, 0, 1), textAlign: "center" }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "5px" }}>6:00 AM // ATHLETICS</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "68px", fontWeight: 950, marginTop: "8px", letterSpacing: "-2px" }}>6:00 AM — RUN</h2>
            </div>

            {/* Focused Running Parallax Area */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              
              {/* 120 - 155: Alarm Clock Zoom Close-up (Hero focal point) */}
              {frame >= 120 && frame < 155 && (
                <div style={{ background: "#0A0A0C", border: `3.5px solid ${COLORS.crimson}`, borderRadius: "24px", padding: "35px 55px", textAlign: "center", transform: `scale(${interpolate(frame - 120, [0, 30], [1.35, 1.0])})`, opacity: val(120, 130, 0, 1), boxShadow: "0 0 40px rgba(210,4,45,0.15)" }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: "64px", fontWeight: 950, color: COLORS.offWhite, letterSpacing: "3px" }}>
                    {frame >= 140 ? "06:00" : "05:59"}
                  </span>
                  <span style={{ display: "block", fontSize: "11px", color: COLORS.crimson, marginTop: "8px", letterSpacing: "4px", fontWeight: 800 }}>PULSE TRIGGER</span>
                </div>
              )}

              {/* 155 - 300: Medium Tracking Shot of the Runner */}
              {frame >= 155 && (
                <svg viewBox="0 0 460 260" width="460" height="260" style={{ overflow: "visible" }}>
                  {/* Ground Line */}
                  <line x1="-100" y1="200" x2="560" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />

                  {/* Parallax Streetlights moving left (cinematic speed) */}
                  <g style={{ opacity: 0.4 }}>
                    <line x1={val(155, 300, 520, -100)} y1="60" x2={val(155, 300, 520, -100)} y2="200" stroke={COLORS.offWhite} strokeWidth="2" />
                    <circle cx={val(155, 300, 520, -100)} cy="60" r="7" fill={COLORS.offWhite} />
                    
                    <line x1={val(155, 300, 840, 220)} y1="60" x2={val(155, 300, 840, 220)} y2="200" stroke={COLORS.offWhite} strokeWidth="2" />
                    <circle cx={val(155, 300, 840, 220)} cy="60" r="7" fill={COLORS.offWhite} />
                  </g>

                  {/* Runner A (Protagonist) - scaled up for hero presence */}
                  <g style={{ transform: `translate(160px, ${95 + Math.sin(frame * 0.45) * 3.5}px) scale(0.8)` }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                    <path d="M 50,44 L 35,90 M 50,44 L 65,80" stroke={COLORS.offWhite} strokeWidth="3.5" strokeLinecap="round" />
                    <path d={`M 35,90 L ${45 + Math.sin(frame * 0.35) * 16},130`} stroke={COLORS.offWhite} strokeWidth="4" strokeLinecap="round" />
                    <path d={`M 35,90 L ${25 - Math.sin(frame * 0.35) * 16},130`} stroke={COLORS.offWhite} strokeWidth="4" strokeLinecap="round" />
                  </g>

                  {/* Runner B (Joins after match) */}
                  {frame >= 250 && (
                    <g style={{ transform: `translate(${val(250, 280, -60, 250)}px, ${95 + Math.sin(frame * 0.45 + 1) * 3.5}px) scale(0.8)`, opacity: val(250, 265, 0, 0.95) }}>
                      <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="3" />
                      <path d="M 50,44 L 35,90 M 50,44 L 65,80" stroke={COLORS.crimson} strokeWidth="3.5" strokeLinecap="round" />
                      <path d={`M 35,90 L ${45 + Math.sin(frame * 0.35 + 1.5) * 16},130`} stroke={COLORS.crimson} strokeWidth="4" strokeLinecap="round" />
                      <path d={`M 35,90 L ${25 - Math.sin(frame * 0.35 + 1.5) * 16},130`} stroke={COLORS.crimson} strokeWidth="4" strokeLinecap="round" />
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* Centered Status Badge */}
            {frame >= 260 && (
              <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(260)})`, opacity: spr(260) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", border: `3px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "12px 30px", borderRadius: "16px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: COLORS.crimson }} />
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.offWhite, fontSize: "13px", fontWeight: 900, letterSpacing: "2.5px" }}>LOCKED // RUNNER CONNECTED</span>
                </div>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 3: Side Quest 02 — BUILD (300 - 390 frames / 0:10 - 0:13) */}
        {/* ================================================== */}
        {frame >= 300 && frame < 390 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "80px 100px", zIndex: 10 }}>
            {/* Large Typography */}
            <div style={{ transform: `translateY(${val(300, 315, -30, 0)}px)`, opacity: val(300, 310, 0, 1), textAlign: "center" }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "5px" }}>NIGHT LAB // DEV</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "62px", fontWeight: 950, marginTop: "8px", letterSpacing: "-2px", lineHeight: "1.1" }}>BUILD SOMETHING — TONIGHT</h2>
            </div>

            {/* Immersive Node Environment (recomposed to fill 4:5 width) */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg viewBox="0 0 460 260" width="460" height="260" style={{ overflow: "visible" }}>
                {/* Large cards */}
                {frame >= 308 && (
                  <rect x="20" y="20" width="130" height="80" rx="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                )}
                {frame >= 318 && (
                  <rect x="290" y="20" width="130" height="80" rx="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                )}
                {frame >= 328 && (
                  <rect x="155" y="150" width="130" height="80" rx="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                )}

                {/* Connection lines */}
                {frame >= 335 && (
                  <line x1="150" y1="60" x2="290" y2="60" stroke={COLORS.crimson} strokeWidth="3" strokeDasharray="6 6" />
                )}
                {frame >= 342 && (
                  <line x1="85" y1="100" x2="155" y2="190" stroke={COLORS.crimson} strokeWidth="3" strokeDasharray="6 6" />
                )}
                {frame >= 348 && (
                  <line x1="355" y1="100" x2="285" y2="190" stroke={COLORS.crimson} strokeWidth="3" strokeDasharray="6 6" />
                )}

                {/* Programmers */}
                {frame >= 310 && (
                  <g style={{ transform: "translate(55px, 32px) scale(0.35)" }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,90 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                  </g>
                )}

                {frame >= 350 && (
                  <g style={{ transform: "translate(190px, 162px) scale(0.35)", opacity: val(350, 360, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="2.5" />
                    <path d="M 50,44 L 20,90 H 80 Z" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="2.5" />
                  </g>
                )}
              </svg>
            </div>

            {/* Notification message (centered low) */}
            {frame >= 350 && (
              <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(350)})`, opacity: spr(350) }}>
                <div style={{ display: "inline-flex", flexDirection: "column", gap: "6px", border: `3px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "16px 35px", borderRadius: "18px", textAlign: "center", boxShadow: "0 0 30px rgba(210,4,45,0.1)" }}>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "11px", fontWeight: 900, letterSpacing: "3px" }}>MESSAGE ACTIVE</span>
                  <span style={{ fontSize: "18px", fontWeight: 900, color: COLORS.offWhite }}>"Bhai... aaj woh idea banaate hain?"</span>
                </div>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 4: Side Quest 03 — TREK (390 - 480 frames / 0:13 - 0:16) */}
        {/* ================================================== */}
        {frame >= 390 && frame < 480 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "80px 100px", zIndex: 10 }}>
            {/* Large Top Heading */}
            <div style={{ transform: `translateY(${val(390, 405, -30, 0)}px)`, opacity: val(390, 395, 0, 1), textAlign: "center" }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "5px" }}>TERRAIN // ASCENT</span>
              <h2 style={{ color: COLORS.offWhite, fontSize: "68px", fontWeight: 950, marginTop: "8px", letterSpacing: "-2px", lineHeight: "1.1" }}>WEEKEND — SIDE QUEST</h2>
            </div>

            {/* Mountain Parallax */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg viewBox="0 0 460 280" width="460" height="280" style={{ overflow: "visible" }}>
                {/* Skyline ridges */}
                <path d="M -80,280 L 150,110 L 320,230 L 460,90 L 560,280 Z" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" style={{ transform: `translateX(${val(390, 480, 30, -30)}px)` }} />
                
                {/* Drawing path */}
                <path
                  d="M 50,280 Q 140,210 210,180 T 320,90"
                  fill="none"
                  stroke={COLORS.offWhite}
                  strokeWidth="3.5"
                  strokeDasharray="400"
                  strokeDashoffset={interpolate(frame - 400, [0, 60], [400, 0], { extrapolateRight: "clamp" })}
                />

                {/* Waypoint STAG Beacon */}
                {frame >= 440 && (
                  <g style={{ transform: `translate(285px, 20px) scale(0.35)`, opacity: val(440, 455, 0, 1) }}>
                    <StagEmblem size={150} color={COLORS.crimson} redTriangle={false} />
                  </g>
                )}

                {/* Climbing hikers */}
                {frame >= 420 && (
                  <g style={{ transform: `translate(${val(410, 470, 60, 240)}px, ${val(410, 470, 260, 140)}px) scale(0.7)` }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                    <rect x="20" y="44" width="18" height="32" rx="5" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="2.5" />
                    <path d="M 50,44 L 35,90 M 50,44 L 65,80" stroke={COLORS.offWhite} strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom status badge */}
            {frame >= 440 && (
              <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(440)})`, opacity: spr(440) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", border: `3px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "12px 30px", borderRadius: "16px" }}>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.offWhite, fontSize: "13px", fontWeight: 900, letterSpacing: "2.5px" }}>5/6 LOCKED ON ROAD</span>
                </div>
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 5: Scooter Night Ride (480 - 570 frames / 0:16 - 0:19) */}
        {/* ================================================== */}
        {frame >= 480 && frame < 570 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "80px 100px", zIndex: 10 }}>
            {/* Title */}
            <div style={{ transform: `translateY(${val(480, 495, -30, 0)}px)`, opacity: val(480, 490, 0, 1), textAlign: "center" }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "5px" }}>MIDNIGHT // HIGHWAY</span>
            </div>

            {/* Massive Campaign Text (occupying ~80% width) */}
            <div style={{ width: "95%", margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <h1 style={{ color: COLORS.offWhite, fontSize: "74px", fontWeight: 950, lineHeight: "1.05", letterSpacing: "-3.5px", textAlign: "center" }}>
                FRIENDS FOR YOUR WILDEST SIDE QUESTS.
              </h1>
            </div>

            {/* Large Scooter Silhouette */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg viewBox="0 0 460 260" width="460" height="260" style={{ overflow: "visible" }}>
                {/* Road */}
                <line x1="-100" y1="180" x2="560" y2="180" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
                <line x1={val(480, 570, 500, -100)} y1="180" x2={val(480, 570, 590, -10)} y2="180" stroke={COLORS.crimson} strokeWidth="4" />

                {/* Scooter & riders */}
                <g style={{ transform: `translate(120px, ${90 + Math.sin(frame * 0.5) * 2.5}px) scale(0.9)` }}>
                  <polygon points="120,60 300,10 300,120" fill="rgba(255, 255, 255, 0.08)" />

                  <circle cx="30" cy="70" r="18" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                  <circle cx="110" cy="70" r="18" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                  
                  <path d="M 30,70 L 60,65 L 110,70 M 110,70 L 100,30 L 80,30" fill="none" stroke={COLORS.offWhite} strokeWidth="3.5" strokeLinecap="round" />
                  
                  <circle cx="65" cy="15" r="11" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                  <path d="M 65,25 C 65,35 70,55 60,65" stroke={COLORS.offWhite} strokeWidth="4" strokeLinecap="round" />

                  <circle cx="45" cy="10" r="11" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                  <path d="M 45,20 C 45,30 50,50 40,60" stroke={COLORS.offWhite} strokeWidth="4" strokeLinecap="round" />
                </g>
              </svg>
            </div>
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 6: Convergence & Actual Meeting (570 - 720 frames / 0:19 - 0:24) */}
        {/* ================================================== */}
        {frame >= 570 && frame < 720 && (
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "80px 100px", zIndex: 10 }}>
            {/* Title */}
            <div style={{ transform: `translateY(${val(570, 585, -30, 0)}px)`, opacity: val(570, 575, 0, 1), textAlign: "center" }}>
              <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "5px" }}>COMMUNITY // LIVE</span>
            </div>

            {/* Campus tea stall gathering */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-end", position: "relative", marginBottom: "-60px" }}>
              <svg viewBox="0 0 460 260" width="460" height="260" style={{ overflow: "visible" }}>
                {/* Stall */}
                <rect x="60" y="160" width="340" height="100" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                <line x1="100" y1="160" x2="100" y2="90" stroke={COLORS.offWhite} strokeWidth="2.5" />
                <line x1="360" y1="160" x2="360" y2="90" stroke={COLORS.offWhite} strokeWidth="2.5" />
                <line x1="100" y1="90" x2="360" y2="90" stroke={COLORS.offWhite} strokeWidth="2.5" />
                
                {/* Sign */}
                {frame % 10 < 7 ? (
                  <rect x="180" y="100" width="100" height="35" rx="5" fill="rgba(210,4,45,0.12)" stroke={COLORS.crimson} strokeWidth="2" />
                ) : (
                  <rect x="180" y="100" width="100" height="35" rx="5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                )}
                <text x="230" y="122" textAnchor="middle" fill={frame % 10 < 7 ? COLORS.crimson : "rgba(255,255,255,0.15)"} fontFamily={FONT_MONO} fontSize="14px" fontWeight="black" letterSpacing="5px">TEA</text>

                {/* Silhouettes gathering */}
                {frame >= 600 && (
                  <g style={{ transform: "translate(70px, 45px) scale(0.65)", opacity: val(600, 615, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                  </g>
                )}

                {frame >= 620 && (
                  <g style={{ transform: "translate(130px, 45px) scale(0.65)", opacity: val(620, 635, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                  </g>
                )}

                {frame >= 640 && (
                  <g style={{ transform: "translate(250px, 45px) scale(0.65)", opacity: val(640, 655, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.offWhite} strokeWidth="3" />
                  </g>
                )}

                {frame >= 660 && (
                  <g style={{ transform: "translate(310px, 45px) scale(0.65)", opacity: val(660, 675, 0, 1) }}>
                    <circle cx="50" cy="30" r="14" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="3" />
                    <path d="M 50,44 L 20,180 H 80 Z" fill="#0A0A0C" stroke={COLORS.crimson} strokeWidth="3" />
                  </g>
                )}
              </svg>
            </div>

            {/* Centered massive brand statement */}
            <div style={{ width: "95%", margin: "0 auto", opacity: val(670, 690, 0, 1), textAlign: "center" }}>
              <h1 style={{ color: COLORS.offWhite, fontSize: "74px", fontWeight: 950, letterSpacing: "-3px", lineHeight: "1.05" }}>
                FIND YOUR PEOPLE.
              </h1>
            </div>
          </AbsoluteFill>
        )}

        {/* ================================================== */}
        {/* SCENE 7: Outro Loop & Logo Hit (720 - 1050 frames / 0:24 - 0:35) */}
        {/* ================================================== */}
        {frame >= 720 && (
          <AbsoluteFill
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "80px 100px",
              backgroundColor: COLORS.black,
              zIndex: 100,
              opacity: interpolate(frame, [720, 740], [0, 1], { extrapolateLeft: "clamp" }),
            }}
          >
            {/* 720 - 870: Dialogue Space (Epilogue Rooftop Loop) */}
            {frame < 870 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <div style={{ opacity: 0.8, textAlign: "center" }}>
                  <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "13px", fontWeight: 700, letterSpacing: "5px" }}>EPILOGUE // THE LOOP</span>
                </div>

                {/* Rooftop silhouettes loop */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: "180px" }}>
                  <svg viewBox="0 0 500 200" width="400" height="160" style={{ overflow: "visible" }}>
                    <line x1="-50" y1="180" x2="550" y2="180" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
                    <g style={{ transform: "translate(150px, 30px) scale(0.65)", opacity: 0.65 }}>
                      <LeaningFriend headBob={Math.sin(frame * 0.1) * 1.0} />
                    </g>
                    <g style={{ transform: "translate(270px, 30px) scale(0.65)", flip: true, opacity: 0.65 }}>
                      <LeaningFriend flip={true} headBob={Math.sin(frame * 0.08) * 1.0} />
                    </g>
                  </svg>
                </div>

                {/* Clean centered final dialogue subtitles */}
                <div style={{ height: "120px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {frame >= 735 && frame < 810 && (
                    <span style={{ color: COLORS.offWhite, fontSize: "40px", fontWeight: 800, textAlign: "center", opacity: val(735, 750, 0, 0.9) }}>
                      “Jeevan saathi ka pata nahi…”
                    </span>
                  )}
                  {frame >= 810 && (
                    <span style={{ color: COLORS.crimson, fontSize: "48px", fontWeight: 950, textAlign: "center", opacity: val(810, 825, 0, 1), textShadow: "0 0 30px rgba(210,4,45,0.35)" }}>
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
                  gap: "40px",
                  transform: `scale(${interpolate(frame - 870, [0, 12], [1.3, 1.0], { extrapolateRight: "clamp" })})`,
                }}
              >
                {/* Scaled-up Stag Emblem */}
                <StagEmblem size={280} />

                {/* Large Bold LOGO text: LOCKIN */}
                <h1
                  style={{
                    fontSize: "110px",
                    fontWeight: 950,
                    letterSpacing: "12px",
                    color: COLORS.offWhite,
                    display: "flex",
                    alignItems: "center",
                    lineHeight: "1.0",
                    marginLeft: "12px",
                  }}
                >
                  L<span style={{ color: COLORS.crimson }}>O</span>CKIN
                </h1>

                {/* Brand Tagline */}
                {frame >= 900 && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: FONT_MONO,
                      fontSize: "15px",
                      fontWeight: 700,
                      letterSpacing: "8px",
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
