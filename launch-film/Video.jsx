import { useCurrentFrame, useVideoConfig, Audio, AbsoluteFill, spring, interpolate } from "remotion";
import React from "react";

// Minimal custom CSS and layout constants
const FONT_SANS = 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FONT_MONO = '"SF Mono", SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace';

const COLORS = {
  black: "#000000",
  offBlack: "#08080A",
  offWhite: "#EDEBDE",
  crimson: "#D2042D",
  gridLine: "rgba(237, 235, 222, 0.05)",
  glowCrimson: "rgba(210, 4, 45, 0.15)",
};

// SVG Stag Emblem Component
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

export const Video = ({ musicEnabled = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Helper spring animation values
  const spr = (startFrame, duration = 12) => {
    return spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 15 },
    });
  };

  // 1. Grid Background opacity pulse based on frame number (tension building)
  const gridOpacity = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.15, 0.45]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, fontFamily: FONT_SANS, overflow: "hidden" }}>
      {/* AUDIO TRACKS */}
      {/* Background Drum Beat */}
      {musicEnabled && (
        <Audio src={require("./assets/audio/music.wav")} volume={0.8} />
      )}
      
      {/* Voiceover lines */}
      <Audio src={require("./assets/audio/line1.mp3")} startFrom={0} playAt={0} />
      <Audio src={require("./assets/audio/line2.mp3")} startFrom={0} playAt={120} />
      <Audio src={require("./assets/audio/line3.mp3")} startFrom={0} playAt={210} />
      <Audio src={require("./assets/audio/line4.mp3")} startFrom={0} playAt={300} />
      <Audio src={require("./assets/audio/line5.mp3")} startFrom={0} playAt={390} />
      <Audio src={require("./assets/audio/line6.mp3")} startFrom={0} playAt={480} />
      <Audio src={require("./assets/audio/line7.mp3")} startFrom={0} playAt={630} />
      <Audio src={require("./assets/audio/line8.mp3")} startFrom={0} playAt={720} />
      <Audio src={require("./assets/audio/line9.mp3")} startFrom={0} playAt={870} />

      {/* Sound Effects (SFX) */}
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

      {/* BACKGROUND GRAPHICS LAYER */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(to right, ${COLORS.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${COLORS.gridLine} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: gridOpacity,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Scanline overlay for digital culture vibe */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 4px, 6px 100%",
          pointerEvents: "none",
          zIndex: 10,
          opacity: 0.8,
        }}
      />

      {/* SCENE COMPOSITIONS */}

      {/* SCENE 1: Intro (0 - 105 frames / 0:00 - 0:03.5) */}
      {frame >= 0 && frame < 105 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", padding: "0 60px", zIndex: 5 }}>
          <h1
            style={{
              color: COLORS.offWhite,
              fontSize: "64px",
              fontWeight: 900,
              textAlign: "center",
              lineHeight: "1.1",
              letterSpacing: "-2px",
              opacity: spr(5),
              transform: `scale(${interpolate(frame, [0, 105], [0.95, 1.05])})`,
            }}
          >
            DOST TOH SABKE PAAS HOTE HAIN.
          </h1>
        </div>
      )}

      {/* SCENE 2: Glitch Question (120 - 210 frames / 0:04 - 0:07) */}
      {frame >= 120 && frame < 210 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 60px",
            zIndex: 5,
            backgroundColor: frame % 4 === 0 && frame < 135 ? COLORS.crimson : "transparent",
          }}
        >
          <h1
            style={{
              color: frame % 4 === 0 && frame < 135 ? COLORS.black : COLORS.crimson,
              fontSize: "72px",
              fontWeight: 950,
              textAlign: "center",
              lineHeight: "1.05",
              letterSpacing: "-2.5px",
              textShadow: "0 0 20px rgba(210, 4, 45, 0.4)",
              transform: `scale(${interpolate(frame - 120, [0, 15], [1.3, 1.0])})`,
            }}
          >
            KARNE WAALE KITNE HAIN?
          </h1>
        </div>
      )}

      {/* SCENE 3: Side Quest 01 - RUN (210 - 300 frames / 0:07 - 0:10) */}
      {frame >= 210 && frame < 300 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "100px 60px", zIndex: 5 }}>
          {/* Header Typography */}
          <div style={{ transform: `translateY(${interpolate(spr(210), [0, 1], [-50, 0])}px)`, opacity: spr(210) }}>
            <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>SIDE QUEST // 01</span>
            <h2 style={{ color: COLORS.offWhite, fontSize: "56px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>6:00 AM — RUN</h2>
          </div>

          {/* Clock & Route Graphic */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "50px", flex: 1, justifyContent: "center" }}>
            {/* Clock Flip Card */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "20px 40px", width: "240px", textAlign: "center" }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: "48px", fontWeight: 900, color: COLORS.offWhite, letterSpacing: "2px" }}>
                {frame >= 240 ? "06:00" : "05:59"}
              </span>
              <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "5px", letterSpacing: "2px", fontWeight: 700 }}>PULSE REPORT</span>
            </div>

            {/* SVG Path Route Map Drawing */}
            <svg viewBox="0 0 300 200" width="300" height="200" style={{ overflow: "visible" }}>
              {/* Path */}
              <path
                d="M 30,150 Q 80,40 150,110 T 270,50"
                fill="none"
                stroke={COLORS.offWhite}
                strokeWidth="3.5"
                strokeDasharray="400"
                strokeDashoffset={interpolate(frame - 220, [0, 45], [400, 0], { extrapolateRight: "clamp" })}
              />
              {/* Signal Node A */}
              {frame >= 235 && (
                <circle cx="30" cy="150" r={interpolate(frame - 235, [0, 10], [15, 6], { extrapolateRight: "clamp" })} fill={COLORS.crimson} />
              )}
              {/* Signal Node B */}
              {frame >= 255 && (
                <circle cx="270" cy="50" r={interpolate(frame - 255, [0, 10], [15, 6], { extrapolateRight: "clamp" })} fill={COLORS.crimson} />
              )}
            </svg>
          </div>

          {/* Locked status confirmation */}
          {frame >= 260 && (
            <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(260)})`, opacity: spr(260) }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", border: `2px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "10px 25px", borderRadius: "14px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORS.crimson, animation: "pulse 1s infinite" }} />
                <span style={{ fontFamily: FONT_MONO, color: COLORS.offWhite, fontSize: "12px", fontWeight: 900, letterSpacing: "2px" }}>LOCKED // RUNWAY</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCENE 4: Side Quest 02 - BUILD (300 - 390 frames / 0:10 - 0:13) */}
      {frame >= 300 && frame < 390 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "100px 60px", zIndex: 5 }}>
          {/* Header */}
          <div style={{ transform: `translateY(${interpolate(spr(300), [0, 1], [-50, 0])}px)`, opacity: spr(300) }}>
            <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>SIDE QUEST // 02</span>
            <h2 style={{ color: COLORS.offWhite, fontSize: "56px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>BUILD SOMETHING — TONIGHT</h2>
          </div>

          {/* Grid Blocks Assembling */}
          <div style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center", position: "relative" }}>
            <svg viewBox="0 0 300 300" width="300" height="300" style={{ overflow: "visible" }}>
              {/* Grid frame boxes */}
              {frame >= 308 && (
                <rect x="30" y="70" width="80" height="80" rx="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" style={{ transform: `scale(${spr(308)})`, transformOrigin: "70px 110px" }} />
              )}
              {frame >= 316 && (
                <rect x="190" y="70" width="80" height="80" rx="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" style={{ transform: `scale(${spr(316)})`, transformOrigin: "230px 110px" }} />
              )}
              {frame >= 324 && (
                <rect x="110" y="180" width="80" height="80" rx="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" style={{ transform: `scale(${spr(324)})`, transformOrigin: "150px 220px" }} />
              )}

              {/* Connections */}
              {frame >= 332 && (
                <line x1="110" y1="110" x2="190" y2="110" stroke={COLORS.crimson} strokeWidth="2.5" strokeDasharray="5 5" />
              )}
              {frame >= 338 && (
                <line x1="70" y1="150" x2="110" y2="220" stroke={COLORS.crimson} strokeWidth="2.5" strokeDasharray="5 5" />
              )}
              {frame >= 344 && (
                <line x1="230" y1="150" x2="190" y2="220" stroke={COLORS.crimson} strokeWidth="2.5" strokeDasharray="5 5" />
              )}

              {/* Inner core signal */}
              {frame >= 350 && (
                <circle cx="150" cy="220" r="10" fill={COLORS.crimson} style={{ transform: `scale(${spr(350)})` }} />
              )}
            </svg>
          </div>

          {/* Locked details */}
          {frame >= 350 && (
            <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(350)})`, opacity: spr(350) }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", border: `2px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "10px 25px", borderRadius: "14px" }}>
                <span style={{ fontFamily: FONT_MONO, color: COLORS.offWhite, fontSize: "12px", fontWeight: 900, letterSpacing: "2px" }}>2/3 LOCKED IN QUEUE</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCENE 5: Side Quest 03 - TREK (390 - 480 frames / 0:13 - 0:16) */}
      {frame >= 390 && frame < 480 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "100px 60px", zIndex: 5 }}>
          {/* Header */}
          <div style={{ transform: `translateY(${interpolate(spr(390), [0, 1], [-50, 0])}px)`, opacity: spr(390) }}>
            <span style={{ fontFamily: FONT_MONO, color: COLORS.crimson, fontSize: "14px", fontWeight: 700, letterSpacing: "4px" }}>SIDE QUEST // 03</span>
            <h2 style={{ color: COLORS.offWhite, fontSize: "56px", fontWeight: 900, marginTop: "10px", lineHeight: "1.1" }}>WEEKEND — SIDE QUEST</h2>
          </div>

          {/* Topo lines drawing path */}
          <div style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center", position: "relative" }}>
            <svg viewBox="0 0 320 320" width="320" height="320" style={{ overflow: "visible" }}>
              {/* Contour circles */}
              <circle cx="160" cy="160" r="130" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
              <circle cx="160" cy="160" r="100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
              <circle cx="160" cy="160" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <circle cx="160" cy="160" r="40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

              {/* Climbing path */}
              <path
                d="M 60,260 Q 100,210 130,200 T 160,160"
                fill="none"
                stroke={COLORS.offWhite}
                strokeWidth="3"
                strokeDasharray="200"
                strokeDashoffset={interpolate(frame - 400, [0, 40], [200, 0], { extrapolateRight: "clamp" })}
              />

              {/* STAG Emblem Waypoint Marker */}
              {frame >= 435 && (
                <g style={{ transform: "translate(135px, 120px) scale(0.25)" }}>
                  <StagEmblem size={200} color={COLORS.crimson} redTriangle={false} />
                </g>
              )}
            </svg>
          </div>

          {/* Locked Badge */}
          {frame >= 440 && (
            <div style={{ display: "flex", justifyContent: "center", transform: `scale(${spr(440)})`, opacity: spr(440) }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", border: `2px solid ${COLORS.crimson}`, background: "rgba(210,4,45,0.06)", padding: "10px 25px", borderRadius: "14px" }}>
                <span style={{ fontFamily: FONT_MONO, color: COLORS.offWhite, fontSize: "12px", fontWeight: 900, letterSpacing: "2px" }}>5/6 LOCKED ON ROAD</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCENE 6: Hero Headline - Wildest Side Quests (480 - 570 frames / 0:16 - 0:19) */}
      {frame >= 480 && frame < 570 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 60px",
            zIndex: 5,
            // Flash screen in red in sync with beat
            backgroundColor: frame % 12 < 3 ? "rgba(210,4,45,0.9)" : "transparent",
          }}
        >
          <h1
            style={{
              color: frame % 12 < 3 ? COLORS.black : COLORS.offWhite,
              fontSize: "64px",
              fontWeight: 950,
              textAlign: "left",
              lineHeight: "1.1",
              letterSpacing: "-2px",
              textShadow: "0 0 30px rgba(0,0,0,0.8)",
              transform: `scale(${interpolate(frame - 480, [0, 90], [1.0, 1.05])})`,
            }}
          >
            FRIENDS FOR YOUR WILDEST SIDE QUESTS.
          </h1>
        </div>
      )}

      {/* SCENE 7: Find Your People Convergence (570 - 720 frames / 0:19 - 0:24) */}
      {frame >= 570 && frame < 720 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "100px 60px", zIndex: 5 }}>
          {/* Top text fades in */}
          {frame >= 570 && frame < 630 && (
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <svg viewBox="0 0 300 300" width="300" height="300" style={{ overflow: "visible" }}>
                {/* Converging nodes */}
                <g style={{ opacity: interpolate(frame, [570, 620], [0, 1]) }}>
                  <line x1="50" y1="50" x2="150" y2="150" stroke={COLORS.crimson} strokeWidth="1.5" />
                  <line x1="250" y1="50" x2="150" y2="150" stroke={COLORS.crimson} strokeWidth="1.5" />
                  <line x1="50" y1="250" x2="150" y2="150" stroke={COLORS.crimson} strokeWidth="1.5" />
                  <line x1="250" y1="250" x2="150" y2="150" stroke={COLORS.crimson} strokeWidth="1.5" />
                  
                  <circle cx="50" cy="50" r="8" fill="white" />
                  <circle cx="250" cy="50" r="8" fill="white" />
                  <circle cx="50" cy="250" r="8" fill="white" />
                  <circle cx="250" cy="250" r="8" fill="white" />
                  <circle cx="150" cy="150" r="16" fill={COLORS.crimson} />
                </g>
              </svg>
            </div>
          )}

          {/* Brand transition screen: FIND YOUR PEOPLE */}
          {frame >= 630 && (
            <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "60px" }}>
              <h1
                style={{
                  color: COLORS.offWhite,
                  fontSize: "80px",
                  fontWeight: 950,
                  textAlign: "center",
                  letterSpacing: "-3px",
                  lineHeight: "1.0",
                }}
              >
                FIND YOUR PEOPLE.
              </h1>
              
              {/* Product UI Slots Card: CREATE, JOIN, SHOW UP */}
              <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "20px" }}>
                {frame >= 645 && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", transform: `translateX(${interpolate(spr(645), [0, 1], [-100, 0])}px)`, opacity: spr(645) }}>
                    <span style={{ fontSize: "28px", fontWeight: 900, color: COLORS.offWhite }}>1. CREATE</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: "10px", color: COLORS.crimson }}>00h 00m</span>
                  </div>
                )}
                {frame >= 660 && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", transform: `translateX(${interpolate(spr(660), [0, 1], [100, 0])}px)`, opacity: spr(660) }}>
                    <span style={{ fontSize: "28px", fontWeight: 900, color: COLORS.offWhite }}>2. JOIN</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: "10px", color: COLORS.crimson }}>RUNWAY ACTIVE</span>
                  </div>
                )}
                {frame >= 675 && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", transform: `translateX(${interpolate(spr(675), [0, 1], [-100, 0])}px)`, opacity: spr(675) }}>
                    <span style={{ fontSize: "28px", fontWeight: 900, color: COLORS.offWhite }}>3. SHOW UP</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: "10px", color: COLORS.crimson }}>LOCKED CONFIRMED</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCENE 8: Final Outro Logo Hit & Hold (720 - 1050 frames / 0:24 - 0:35) */}
      {frame >= 720 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: COLORS.black,
            zIndex: 100,
            // Fade-in transition from the previous scene
            opacity: interpolate(frame, [720, 740], [0, 1], { extrapolateLeft: "clamp" }),
          }}
        >
          {/* Hold on pure black during "Jeevan saathi ka pata nahi..." */}
          {frame < 870 && (
            <div style={{ padding: "0 60px", textAlign: "center" }}>
              <span
                style={{
                  color: COLORS.offWhite,
                  fontSize: "32px",
                  fontWeight: 600,
                  opacity: interpolate(frame, [735, 755, 850, 870], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                Jeevan saathi ka pata nahi...
              </span>
            </div>
          )}

          {/* LOGO HIT at frame 870 (32.0s) */}
          {frame >= 870 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "50px",
                transform: `scale(${interpolate(frame - 870, [0, 15], [1.3, 1.0], { extrapolateRight: "clamp" })})`,
              }}
            >
              {/* White Minimalist line-art Stag with Red Triangle */}
              <StagEmblem size={240} />

              {/* Bold LOGO text: LOCKIN */}
              <h1
                style={{
                  fontSize: "90px",
                  fontWeight: 950,
                  letterSpacing: "8px",
                  color: COLORS.offWhite,
                  display: "flex",
                  alignItems: "center",
                  lineHeight: "1.0",
                }}
              >
                L<span style={{ color: COLORS.crimson }}>O</span>CKIN
              </h1>

              {/* Tagline: FIND YOUR PEOPLE */}
              {frame >= 900 && (
                <span
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: FONT_MONO,
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "6px",
                    textTransform: "uppercase",
                    marginTop: "-10px",
                    opacity: interpolate(frame, [900, 930], [0, 1]),
                  }}
                >
                  FIND YOUR PEOPLE.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
