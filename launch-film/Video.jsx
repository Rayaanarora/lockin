import {
  useCurrentFrame,
  useVideoConfig,
  Audio,
  AbsoluteFill,
  spring,
  interpolate,
  Easing,
} from "remotion";
import React from "react";

const FONT_SANS = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
const FONT_MONO = '"SF Mono", "Fira Code", Consolas, monospace';

const C = {
  black: "#000000",
  deep: "#060608",
  offWhite: "#EDEBDE",
  white: "#FFFFFF",
  crimson: "#D2042D",
  crimsonDim: "rgba(210,4,45,0.18)",
  gridLine: "rgba(237,235,222,0.04)",
};

// ─── Eased interpolation helper ─────────────────────────────────────────────
const ease = (f, [f0, f1], [v0, v1], easeFn = Easing.out(Easing.cubic)) =>
  interpolate(f, [f0, f1], [v0, v1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFn,
  });

// ─── Spring helper ────────────────────────────────────────────────────────────
const spr = (frame, start, cfg = {}) =>
  spring({ frame: frame - start, fps: 30, config: { damping: 14, stiffness: 120, ...cfg } });

// ─── Stag Emblem ─────────────────────────────────────────────────────────────
const Stag = ({ size = 200, color = "#EDEBDE", showTriangle = true }) => (
  <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
    <line x1="100" y1="185" x2="100" y2="88" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <path d="M100,88 Q68,68 40,56" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M78,77 Q55,52 20,55" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M58,64 Q42,38 8,36" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M44,57 Q28,30 14,20" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M100,88 Q132,68 160,56" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M122,77 Q145,52 180,55" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M142,64 Q158,38 192,36" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M156,57 Q172,30 186,20" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {showTriangle && <polygon points="100,42 93,54 107,54" fill={C.crimson} />}
  </svg>
);

// ─── Person silhouette (simple, stylized) ─────────────────────────────────────
const Person = ({ x = 0, y = 0, scale = 1, color = C.offWhite, headBob = 0, armSwing = 0, legSwing = 0, running = false }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    {/* Head */}
    <circle cx="0" cy={-70 + headBob} r="12" fill={C.deep} stroke={color} strokeWidth="2.5" />
    {/* Torso */}
    <path d="M0,-58 L0,-20" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {running ? (
      <>
        {/* Running arms */}
        <path d={`M0,-48 L${-18 + armSwing * 12},-30`} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M0,-48 L${18 - armSwing * 12},-32`} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {/* Running legs */}
        <path d={`M0,-20 L${-12 + legSwing * 14},10`} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d={`M0,-20 L${12 - legSwing * 14},8`} stroke={color} strokeWidth="3" strokeLinecap="round" />
      </>
    ) : (
      <>
        {/* Standing arms */}
        <path d="M0,-48 L-16,-30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M0,-48 L16,-28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {/* Standing legs */}
        <path d="M0,-20 L-10,20" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M0,-20 L10,20" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </>
    )}
  </g>
);

// ─── Parallax cityscape row ────────────────────────────────────────────────────
const CityLayer = ({ y, opacity, buildings, dx = 0 }) => (
  <g style={{ opacity }} transform={`translate(${dx},0)`}>
    {buildings.map((b, i) => (
      <rect key={i} x={b.x} y={y - b.h} width={b.w} height={b.h} fill="none" stroke={C.offWhite} strokeWidth="1.5" />
    ))}
  </g>
);

// ─── Grid overlay ─────────────────────────────────────────────────────────────
const Grid = ({ opacity = 0.18 }) => (
  <div
    style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: `linear-gradient(${C.gridLine} 1px,transparent 1px),linear-gradient(90deg,${C.gridLine} 1px,transparent 1px)`,
      backgroundSize: "90px 90px",
      opacity,
    }}
  />
);

// ─── Mission Badge ────────────────────────────────────────────────────────────
const MissionBadge = ({ label, count, opacity = 1, scale = 1 }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: "10px",
    border: `2.5px solid ${C.crimson}`, background: C.crimsonDim,
    padding: "10px 26px", borderRadius: "14px",
    transform: `scale(${scale})`, opacity,
  }}>
    <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: C.crimson }} />
    <span style={{ fontFamily: FONT_MONO, color: C.offWhite, fontSize: "13px", fontWeight: 800, letterSpacing: "2px" }}>
      {count} {label}
    </span>
  </div>
);

// ─── Main Video Component ─────────────────────────────────────────────────────
export const Video = ({ musicEnabled = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Handheld camera micro-movement
  const cx = Math.cos(frame * 0.063) * 5;
  const cy = Math.sin(frame * 0.051) * 4;
  const cs = 1 + Math.sin(frame * 0.037) * 0.018;

  // Running physics helpers
  const runCycle = Math.sin(frame * 0.38);
  const runCycle2 = Math.sin(frame * 0.38 + Math.PI);

  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT_SANS, overflow: "hidden" }}>
      <Grid opacity={0.2} />

      {/* ── AUDIO ─────────────────────────────────────────────────────────── */}
      {musicEnabled && <Audio src={require("./assets/audio/music.wav")} volume={0.75} />}

      {/* Voiceover timing: each line fires at its frame */}
      <Audio src={require("./assets/audio/line1.mp3")} startFrom={0} playAt={5} />     {/* 0.17s */}
      <Audio src={require("./assets/audio/line2.mp3")} startFrom={0} playAt={100} />   {/* 3.33s */}
      <Audio src={require("./assets/audio/line3.mp3")} startFrom={0} playAt={210} />   {/* 7.0s  */}
      <Audio src={require("./assets/audio/line4.mp3")} startFrom={0} playAt={318} />   {/* 10.6s */}
      <Audio src={require("./assets/audio/line5.mp3")} startFrom={0} playAt={408} />   {/* 13.6s */}
      <Audio src={require("./assets/audio/line6.mp3")} startFrom={0} playAt={498} />   {/* 16.6s */}
      <Audio src={require("./assets/audio/line7.mp3")} startFrom={0} playAt={630} />   {/* 21.0s */}
      <Audio src={require("./assets/audio/line8.mp3")} startFrom={0} playAt={750} />   {/* 25.0s */}
      <Audio src={require("./assets/audio/line9.mp3")} startFrom={0} playAt={828} />   {/* 27.6s */}

      {/* SFX */}
      <Audio src={require("./assets/audio/static_hit.wav")} playAt={100} volume={0.65} />
      <Audio src={require("./assets/audio/tick.wav")} playAt={210} volume={0.6} />
      <Audio src={require("./assets/audio/whoosh.wav")} playAt={245} volume={0.55} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={275} volume={0.65} />
      <Audio src={require("./assets/audio/type_click.wav")} playAt={320} volume={0.45} />
      <Audio src={require("./assets/audio/type_click.wav")} playAt={332} volume={0.45} />
      <Audio src={require("./assets/audio/type_click.wav")} playAt={344} volume={0.45} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={370} volume={0.65} />
      <Audio src={require("./assets/audio/whoosh.wav")} playAt={408} volume={0.55} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={455} volume={0.65} />
      <Audio src={require("./assets/audio/bass_impact.wav")} playAt={498} volume={0.85} />
      <Audio src={require("./assets/audio/locked_chime.wav")} playAt={700} volume={0.65} />
      <Audio src={require("./assets/audio/logo_impact.wav")} playAt={888} volume={1.0} />

      {/* ── CAMERA WRAPPER ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${cs}) translate(${cx}px,${cy}px)`,
      }}>

        {/* ================================================================= */}
        {/* SCENE 1 — Rooftop Conversation (0–130 frames, 0–4.3s)             */}
        {/* ================================================================= */}
        {frame < 130 && (() => {
          const appear = ease(frame, [0, 20], [0, 1]);
          const headBobA = Math.sin(frame * 0.12) * 2;
          const headBobB = Math.sin(frame * 0.09 + 1) * 1.5;

          return (
            <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Background cityscape parallax */}
              <svg style={{ position: "absolute", bottom: "240px", width: "100%", opacity: 0.22 }} viewBox="0 0 1080 500" width="1080" height="500">
                <CityLayer y={500} opacity={1} dx={ease(frame, [0, 300], [0, -30])} buildings={[
                  { x: 30, h: 340, w: 90 }, { x: 150, h: 420, w: 70 }, { x: 260, h: 280, w: 100 },
                  { x: 400, h: 390, w: 80 }, { x: 510, h: 310, w: 110 }, { x: 660, h: 450, w: 75 },
                  { x: 770, h: 280, w: 90 }, { x: 900, h: 360, w: 100 }, { x: 1010, h: 400, w: 60 },
                ]} />
              </svg>

              {/* Rooftop scene: two characters at railing, centered */}
              <div style={{ position: "absolute", bottom: "200px", width: "100%", display: "flex", justifyContent: "center" }}>
                <svg viewBox="0 0 600 280" width="600" height="280" style={{ overflow: "visible" }}>
                  {/* Railing */}
                  <line x1="-100" y1="240" x2="700" y2="240" stroke={C.offWhite} strokeWidth="3.5" />
                  <line x1="-100" y1="258" x2="700" y2="258" stroke={C.offWhite} strokeWidth="2" opacity={0.4} strokeDasharray="10 8" />
                  <line x1="100" y1="240" x2="100" y2="280" stroke={C.offWhite} strokeWidth="2" />
                  <line x1="500" y1="240" x2="500" y2="280" stroke={C.offWhite} strokeWidth="2" />

                  {/* Character A leaning on railing */}
                  <g transform="translate(150,210)">
                    <Person y={0} color={C.offWhite} headBob={headBobA} />
                    {/* Leaning arm on railing */}
                    <line x1="-16" y1="-30" x2="-30" y2="0" stroke={C.offWhite} strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* Character B facing A */}
                  <g transform="translate(450,210) scale(-1,1)">
                    <Person y={0} color={C.offWhite} headBob={headBobB} />
                    <line x1="-16" y1="-30" x2="-30" y2="0" stroke={C.offWhite} strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* Subtle connecting gaze line */}
                  <line x1="162" y1="140" x2="438" y2="140" stroke={C.crimson} strokeWidth="1" opacity={0.2} strokeDasharray="6 6" />
                </svg>
              </div>

              {/* ── LARGE CENTERED TYPOGRAPHY ── */}
              <div style={{
                position: "absolute", top: "80px",
                width: "90%", textAlign: "center",
                opacity: appear,
                transform: `translateY(${ease(frame, [0, 25], [20, 0])}px)`,
              }}>
                <h1 style={{ color: C.offWhite, fontSize: "76px", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-3px", margin: 0 }}>
                  DOST TOH SABKE PAAS HOTE HAIN.
                </h1>
              </div>

              {/* Second line — bigger, crimson, appears at 100f */}
              {frame >= 95 && (
                <div style={{
                  position: "absolute", bottom: "90px",
                  width: "90%", textAlign: "center",
                  opacity: ease(frame, [95, 115], [0, 1]),
                  transform: `translateY(${ease(frame, [95, 115], [24, 0])}px)`,
                }}>
                  <h1 style={{ color: C.crimson, fontSize: "80px", fontWeight: 950, lineHeight: 1.0, letterSpacing: "-3px", margin: 0, textShadow: `0 0 35px rgba(210,4,45,0.4)` }}>
                    PAR KARNE WAALE KITNE HAIN?
                  </h1>
                </div>
              )}
            </AbsoluteFill>
          );
        })()}

        {/* ================================================================= */}
        {/* SCENE 2 — 6 AM RUN (130–310 frames, 4.3–10.3s)                   */}
        {/* ================================================================= */}
        {frame >= 130 && frame < 310 && (() => {
          const lf = frame - 130; // local frame
          const sceneIn = ease(lf, [0, 20], [0, 1]);

          // Parallax streetlight positions
          const light1x = ease(lf, [0, 180], [900, -200]);
          const light2x = ease(lf, [0, 180], [1250, 150]);

          // Runner A (protagonist) — in center, running
          const runnerAy = 640 + Math.sin(lf * 0.38) * 5;

          // Runner B joins at lf=110 (frame 240), slides in from right
          const runnerBx = lf >= 110 ? ease(lf, [110, 145], [1180, 680]) : 1200;
          const runnerBOpacity = lf >= 110 ? ease(lf, [110, 145], [0, 1]) : 0;

          // Show alarm first (lf 0–45), then street (lf 45+)
          const showAlarm = lf < 50;
          const alarmScale = showAlarm ? ease(lf, [0, 30], [1.4, 1.0]) : ease(lf, [45, 55], [1, 0]);
          const streetOpacity = lf >= 40 ? ease(lf, [40, 65], [0, 1]) : 0;

          return (
            <AbsoluteFill style={{ opacity: sceneIn }}>
              {/* ── ALARM CLOSE-UP ── */}
              {lf < 58 && (
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: `translate(-50%,-50%) scale(${alarmScale})`,
                  opacity: ease(lf, [0, 15], [0, 1]),
                }}>
                  <div style={{
                    background: C.deep, border: `4px solid ${C.crimson}`,
                    borderRadius: "28px", padding: "40px 60px", textAlign: "center",
                    boxShadow: `0 0 50px rgba(210,4,45,0.25)`,
                  }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: "74px", fontWeight: 950, color: C.offWhite, letterSpacing: "4px" }}>
                      {lf < 30 ? "05:57" : lf < 38 ? "05:58" : "06:00"}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: "12px", color: C.crimson, letterSpacing: "4px", marginTop: "8px", fontWeight: 800 }}>
                      {lf >= 38 ? "● ALARM TRIGGERED" : "STANDBY"}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STREET SCENE ── */}
              <svg
                style={{ position: "absolute", inset: 0, opacity: streetOpacity }}
                viewBox="0 0 1080 1350"
                width="1080" height="1350"
              >
                {/* Ground / road */}
                <line x1="0" y1="700" x2="1080" y2="700" stroke={C.offWhite} strokeWidth="2" opacity={0.2} />

                {/* Street markings (parallax) */}
                {[0, 1, 2, 3].map(i => (
                  <line key={i}
                    x1={((i * 280 - lf * 2.2) % 1200 + 1200) % 1200 - 60}
                    y1="700"
                    x2={((i * 280 - lf * 2.2) % 1200 + 1200) % 1200 + 80}
                    y2="700"
                    stroke={C.offWhite} strokeWidth="3" opacity={0.15} strokeDasharray="60 20"
                  />
                ))}

                {/* Moving streetlights — far layer */}
                <line x1={light1x} y1="400" x2={light1x} y2="700" stroke={C.offWhite} strokeWidth="2" opacity={0.35} />
                <circle cx={light1x} cy="400" r="8" fill={C.offWhite} opacity={0.35} />
                <line x1={light2x} y1="400" x2={light2x} y2="700" stroke={C.offWhite} strokeWidth="2" opacity={0.35} />
                <circle cx={light2x} cy="400" r="8" fill={C.offWhite} opacity={0.35} />

                {/* Sunrise glow at top */}
                {lf >= 60 && (
                  <defs>
                    <radialGradient id="sunrise" cx="50%" cy="0%" r="55%">
                      <stop offset="0%" stopColor="rgba(210,4,45,0.18)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </radialGradient>
                  </defs>
                )}
                {lf >= 60 && (
                  <rect x="0" y="0" width="1080" height="500" fill="url(#sunrise)" opacity={ease(lf, [60, 100], [0, 1])} />
                )}

                {/* Background city silhouette */}
                <g opacity={0.12}>
                  {[80, 200, 350, 500, 650, 800, 950].map((bx, i) => (
                    <rect key={i} x={bx} y={500 - [180, 240, 160, 280, 200, 250, 190][i]}
                      width={[80, 60, 100, 70, 90, 65, 85][i]}
                      height={[180, 240, 160, 280, 200, 250, 190][i]}
                      fill="none" stroke={C.offWhite} strokeWidth="1.5"
                    />
                  ))}
                </g>

                {/* Route path (draws in) */}
                {lf >= 55 && (
                  <path
                    d="M 150,700 Q 400,695 540,698 T 900,700"
                    fill="none" stroke={C.crimson} strokeWidth="3"
                    strokeDasharray="800"
                    strokeDashoffset={ease(lf, [55, 130], [800, 0], Easing.out(Easing.quad))}
                    opacity={0.8}
                  />
                )}

                {/* Runner A — center frame */}
                <g transform={`translate(540,${runnerAy})`}>
                  <Person scale={1.1} color={C.offWhite}
                    headBob={Math.sin(lf * 0.38) * 3}
                    armSwing={runCycle} legSwing={runCycle2}
                    running={lf >= 48}
                  />
                </g>

                {/* Runner B — joins from right */}
                <g transform={`translate(${runnerBx},${runnerAy + 3})`} opacity={runnerBOpacity}>
                  <Person scale={1.1} color={C.crimson}
                    headBob={Math.sin(lf * 0.38 + 1.2) * 3}
                    armSwing={-runCycle} legSwing={-runCycle2}
                    running={true}
                  />
                </g>
              </svg>

              {/* ── TYPOGRAPHY OVERLAYS ── */}
              <div style={{ position: "absolute", top: "80px", width: "100%", textAlign: "center", opacity: lf >= 45 ? ease(lf, [45, 65], [0, 1]) : 0 }}>
                <div style={{ fontFamily: FONT_MONO, color: C.crimson, fontSize: "13px", letterSpacing: "5px", fontWeight: 800 }}>6:00 AM // ATHLETICS</div>
                <h2 style={{ color: C.offWhite, fontSize: "72px", fontWeight: 950, letterSpacing: "-2.5px", lineHeight: 1.0, margin: "8px 0 0" }}>
                  6:00 AM — RUN
                </h2>
              </div>

              {/* VO text: line 3 */}
              {lf >= 75 && lf < 140 && (
                <div style={{
                  position: "absolute", bottom: "120px", width: "100%", textAlign: "center",
                  opacity: ease(lf, [75, 92], [0, 0.85]),
                }}>
                  <span style={{ color: C.offWhite, fontSize: "30px", fontWeight: 600 }}>
                    "Koi hai jo subah 6 baje run pe chale?"
                  </span>
                </div>
              )}

              {/* Mission badge */}
              {lf >= 140 && (
                <div style={{
                  position: "absolute", bottom: "100px", width: "100%", display: "flex", justifyContent: "center",
                  opacity: ease(lf, [140, 160], [0, 1]),
                  transform: `scale(${ease(lf, [140, 160], [0.85, 1])})`,
                }}>
                  <MissionBadge label="LOCKED IN" count="2/2" />
                </div>
              )}
            </AbsoluteFill>
          );
        })()}

        {/* ================================================================= */}
        {/* SCENE 3 — BUILD (310–420 frames, 10.3–14.0s)                      */}
        {/* ================================================================= */}
        {frame >= 310 && frame < 420 && (() => {
          const lf = frame - 310;
          const sceneIn = ease(lf, [0, 18], [0, 1]);

          // 3 workspace nodes in a triangle layout (fill the 4:5 frame)
          const nodes = [
            { cx: 220, cy: 480 },
            { cx: 860, cy: 480 },
            { cx: 540, cy: 780 },
          ];

          return (
            <AbsoluteFill style={{ opacity: sceneIn }}>
              <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1350" width="1080" height="1350">
                {/* Dark desk glow */}
                <defs>
                  <radialGradient id="deskglow" cx="50%" cy="60%" r="50%">
                    <stop offset="0%" stopColor="rgba(210,4,45,0.07)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width="1080" height="1350" fill="url(#deskglow)" />

                {/* Node cards — large and centered */}
                {nodes.map((n, i) => lf >= i * 12 && (
                  <g key={i} transform={`translate(${n.cx - 130},${n.cy - 80})`}
                    style={{ opacity: ease(lf, [i * 12, i * 12 + 20], [0, 1]) }}>
                    <rect width="260" height="160" rx="20" fill={C.deep} stroke={C.offWhite} strokeWidth="2.5" />
                    {/* Person inside node */}
                    <g transform="translate(130,70)">
                      <Person scale={0.55} color={i === 2 ? C.crimson : C.offWhite}
                        headBob={Math.sin(lf * 0.15 + i) * 1.5}
                      />
                    </g>
                    {/* Blinking cursor */}
                    {lf >= 30 && lf % 14 < 10 && (
                      <rect x="16" y="130" width="2" height="16" fill={i === 2 ? C.crimson : C.offWhite} />
                    )}
                    {/* Code lines */}
                    <line x1="16" y1="120" x2={140 + Math.sin(lf * 0.3 + i) * 30} y2="120" stroke={C.offWhite} strokeWidth="2" opacity={0.3} />
                    <line x1="16" y1="108" x2={100 + Math.sin(lf * 0.2 + i) * 20} y2="108" stroke={C.offWhite} strokeWidth="2" opacity={0.2} />
                  </g>
                ))}

                {/* Connection lines between nodes */}
                {lf >= 38 && (
                  <line x1="350" y1="480" x2="730" y2="480"
                    stroke={C.crimson} strokeWidth="2.5" strokeDasharray="8 6"
                    opacity={ease(lf, [38, 55], [0, 0.8])}
                  />
                )}
                {lf >= 45 && (
                  <line x1="220" y1="560" x2="410" y2="780"
                    stroke={C.crimson} strokeWidth="2.5" strokeDasharray="8 6"
                    opacity={ease(lf, [45, 62], [0, 0.8])}
                  />
                )}
                {lf >= 45 && (
                  <line x1="860" y1="560" x2="670" y2="780"
                    stroke={C.crimson} strokeWidth="2.5" strokeDasharray="8 6"
                    opacity={ease(lf, [45, 62], [0, 0.8])}
                  />
                )}
              </svg>

              {/* Heading */}
              <div style={{ position: "absolute", top: "80px", width: "100%", textAlign: "center", opacity: ease(lf, [0, 20], [0, 1]) }}>
                <div style={{ fontFamily: FONT_MONO, color: C.crimson, fontSize: "13px", letterSpacing: "5px", fontWeight: 800 }}>NIGHT LAB // DEV</div>
                <h2 style={{ color: C.offWhite, fontSize: "68px", fontWeight: 950, letterSpacing: "-2px", lineHeight: 1.05, margin: "8px 60px 0" }}>
                  BUILD SOMETHING — TONIGHT
                </h2>
              </div>

              {/* Message notification */}
              {lf >= 55 && (
                <div style={{
                  position: "absolute", bottom: "95px", width: "100%", display: "flex", justifyContent: "center",
                  opacity: ease(lf, [55, 75], [0, 1]),
                  transform: `translateY(${ease(lf, [55, 75], [20, 0])}px)`,
                }}>
                  <div style={{ border: `3px solid ${C.crimson}`, background: C.crimsonDim, borderRadius: "18px", padding: "18px 32px", textAlign: "center" }}>
                    <div style={{ fontFamily: FONT_MONO, color: C.crimson, fontSize: "11px", letterSpacing: "3px", fontWeight: 900, marginBottom: "6px" }}>MESSAGE RECEIVED</div>
                    <div style={{ color: C.offWhite, fontSize: "20px", fontWeight: 800 }}>"Bhai… aaj woh idea banaate hain?"</div>
                  </div>
                </div>
              )}
            </AbsoluteFill>
          );
        })()}

        {/* ================================================================= */}
        {/* SCENE 4 — TREK (420–540 frames, 14.0–18.0s)                       */}
        {/* ================================================================= */}
        {frame >= 420 && frame < 540 && (() => {
          const lf = frame - 420;
          const sceneIn = ease(lf, [0, 18], [0, 1]);

          // Parallax mountain layers
          const bg = ease(lf, [0, 120], [0, -40]);
          const mg = ease(lf, [0, 120], [0, -80]);
          const fg = ease(lf, [0, 120], [0, -130]);

          // Hikers: 1 at lf=0, 2nd at lf=50, 3rd at lf=80, 4th at lf=100
          const hikers = [
            { dx: 0, appear: 0 },
            { dx: 80, appear: 50 },
            { dx: -70, appear: 80 },
            { dx: 140, appear: 100 },
          ];

          // Trail progress
          const trailProgress = ease(lf, [10, 110], [0, 1], Easing.out(Easing.cubic));

          return (
            <AbsoluteFill style={{ opacity: sceneIn }}>
              <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1350" width="1080" height="1350">
                {/* Sky glow / sunrise */}
                <defs>
                  <radialGradient id="sunrise2" cx="50%" cy="20%" r="60%">
                    <stop offset="0%" stopColor="rgba(210,4,45,0.12)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                </defs>
                <rect width="1080" height="1350" fill="url(#sunrise2)" opacity={ease(lf, [40, 100], [0, 1])} />

                {/* Far mountain layer */}
                <g transform={`translate(${bg},0)`} opacity={0.12}>
                  <path d="M -100,900 L 180,500 L 400,750 L 650,400 L 900,600 L 1150,450 L 1300,900 Z" fill="none" stroke={C.offWhite} strokeWidth="2" />
                </g>

                {/* Mid mountain layer */}
                <g transform={`translate(${mg},0)`} opacity={0.2}>
                  <path d="M -100,950 L 100,700 L 350,850 L 540,580 L 760,800 L 1000,620 L 1200,950 Z" fill={C.deep} stroke={C.offWhite} strokeWidth="2.5" />
                </g>

                {/* Foreground terrain */}
                <g transform={`translate(${fg},0)`}>
                  <path d="M -100,1100 L 220,820 L 440,960 L 700,760 L 900,900 L 1200,800 L 1300,1100 Z" fill={C.deep} stroke={C.offWhite} strokeWidth="3" />
                </g>

                {/* Ground line */}
                <line x1="-100" y1="1080" x2="1180" y2="1080" stroke={C.offWhite} strokeWidth="2" opacity={0.15} />

                {/* Trail path drawing in */}
                <path
                  d="M 100,1060 Q 300,920 480,830 T 720,660 Q 840,580 900,520"
                  fill="none" stroke={C.crimson} strokeWidth="3.5"
                  strokeDasharray="800"
                  strokeDashoffset={800 - trailProgress * 800}
                  opacity={0.9}
                />

                {/* Stag emblem as waypoint at trail end */}
                {lf >= 100 && (
                  <g transform="translate(830,380)" opacity={ease(lf, [100, 118], [0, 1])}>
                    <Stag size={80} color={C.crimson} showTriangle={false} />
                  </g>
                )}

                {/* Hikers with backpacks */}
                {hikers.map((h, i) => lf >= h.appear && (
                  <g key={i} transform={`translate(${540 + h.dx}, 1040)`} opacity={ease(lf, [h.appear, h.appear + 20], [0, 1])}>
                    {/* Backpack */}
                    <rect x="-14" y="-85" width="14" height="28" rx="4" fill={C.deep} stroke={i === 0 ? C.offWhite : C.crimson} strokeWidth="2" />
                    <Person scale={0.7} color={i === 0 ? C.offWhite : C.crimson}
                      headBob={Math.sin(lf * 0.2 + i * 0.8) * 2}
                    />
                  </g>
                ))}
              </svg>

              {/* Heading */}
              <div style={{ position: "absolute", top: "80px", width: "100%", textAlign: "center", opacity: ease(lf, [0, 22], [0, 1]) }}>
                <div style={{ fontFamily: FONT_MONO, color: C.crimson, fontSize: "13px", letterSpacing: "5px", fontWeight: 800 }}>TERRAIN // ASCENT</div>
                <h2 style={{ color: C.offWhite, fontSize: "72px", fontWeight: 950, letterSpacing: "-2.5px", lineHeight: 1.0, margin: "8px 60px 0" }}>
                  WEEKEND — SIDE QUEST
                </h2>
              </div>

              {/* Badge */}
              {lf >= 100 && (
                <div style={{
                  position: "absolute", bottom: "95px", width: "100%", display: "flex", justifyContent: "center",
                  opacity: ease(lf, [100, 118], [0, 1]),
                }}>
                  <MissionBadge label="LOCKED ON ROAD" count="5/6" />
                </div>
              )}
            </AbsoluteFill>
          );
        })()}

        {/* ================================================================= */}
        {/* SCENE 5 — MIDNIGHT FOOD RUN (540–640 frames, 18.0–21.3s)          */}
        {/* ================================================================= */}
        {frame >= 540 && frame < 640 && (() => {
          const lf = frame - 540;
          const sceneIn = ease(lf, [0, 18], [0, 1]);

          // Scooter moving through frame
          const scooterX = ease(lf, [0, 100], [-200, 1000], Easing.inOut(Easing.cubic));
          const roadDash = (lf * 3.5) % 120;

          return (
            <AbsoluteFill style={{ opacity: sceneIn }}>
              <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1350" width="1080" height="1350">
                {/* Night sky gradient */}
                <defs>
                  <radialGradient id="nightglow" cx={`${scooterX / 1080 * 100}%`} cy="60%" r="40%">
                    <stop offset="0%" stopColor="rgba(237,235,222,0.04)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                </defs>
                <rect width="1080" height="1350" fill="url(#nightglow)" />

                {/* Road */}
                <line x1="0" y1="800" x2="1080" y2="800" stroke={C.offWhite} strokeWidth="2.5" opacity={0.18} />

                {/* Road dashes */}
                {[-2, -1, 0, 1, 2, 3, 4].map(i => (
                  <line key={i}
                    x1={(i * 160 - roadDash + 1600) % 1200 - 60}
                    y1="800" x2={(i * 160 - roadDash + 1600) % 1200 + 60} y2="800"
                    stroke={C.offWhite} strokeWidth="3" opacity={0.2}
                  />
                ))}

                {/* Scooter */}
                <g transform={`translate(${scooterX}, 745)`}>
                  {/* Headlight cone */}
                  <polygon points="60,28 220,-40 220,100" fill="rgba(255,255,255,0.06)" />

                  {/* Wheels */}
                  <circle cx="10" cy="55" r="20" fill={C.deep} stroke={C.offWhite} strokeWidth="2.5" />
                  <circle cx="100" cy="55" r="20" fill={C.deep} stroke={C.offWhite} strokeWidth="2.5" />

                  {/* Frame */}
                  <path d="M10,55 L50,45 L100,55 M100,55 L95,18 L75,18" fill="none" stroke={C.offWhite} strokeWidth="3" strokeLinecap="round" />
                  <line x1="50" y1="45" x2="45" y2="18" stroke={C.offWhite} strokeWidth="3" strokeLinecap="round" />

                  {/* Rider A (driver) */}
                  <g transform="translate(60,0)">
                    <Person scale={0.55} color={C.offWhite} headBob={Math.sin(lf * 0.5) * 1.5} />
                  </g>

                  {/* Rider B (pillion) */}
                  <g transform="translate(38,2)">
                    <Person scale={0.52} color={C.crimson} headBob={Math.sin(lf * 0.5 + 0.8) * 1.5} />
                  </g>
                </g>

                {/* Street lamps */}
                {[0, 360, 720].map((bx, i) => (
                  <g key={i}>
                    <line x1={(bx - lf * 2.2 + 1200) % 1200} y1="580" x2={(bx - lf * 2.2 + 1200) % 1200} y2="800"
                      stroke={C.offWhite} strokeWidth="2" opacity={0.3} />
                    <circle cx={(bx - lf * 2.2 + 1200) % 1200} cy="580" r="7" fill={C.offWhite} opacity={0.3} />
                  </g>
                ))}
              </svg>

              {/* MASSIVE CAMPAIGN TEXT — centered, dominant */}
              <div style={{
                position: "absolute", top: "95px",
                width: "100%", textAlign: "center",
                opacity: ease(lf, [15, 35], [0, 1]),
              }}>
                <h1 style={{ color: C.offWhite, fontSize: "80px", fontWeight: 950, lineHeight: 1.0, letterSpacing: "-3.5px", margin: "0 60px" }}>
                  FRIENDS FOR YOUR WILDEST SIDE QUESTS.
                </h1>
              </div>

              {/* Midnight tag */}
              <div style={{
                position: "absolute", bottom: "95px", width: "100%", textAlign: "center",
                opacity: ease(lf, [20, 40], [0, 0.7]),
              }}>
                <span style={{ fontFamily: FONT_MONO, color: C.crimson, fontSize: "13px", letterSpacing: "5px", fontWeight: 800 }}>
                  MIDNIGHT // SPONTANEOUS ROAD RUN
                </span>
              </div>
            </AbsoluteFill>
          );
        })()}

        {/* ================================================================= */}
        {/* SCENE 6 — CONVERGENCE & MEETING (640–760 frames, 21.3–25.3s)      */}
        {/* ================================================================= */}
        {frame >= 640 && frame < 760 && (() => {
          const lf = frame - 640;
          const sceneIn = ease(lf, [0, 18], [0, 1]);

          // 4 people converging from cardinal directions
          const convergePeople = [
            { startX: -100, startY: 675, endX: 540, endY: 675, appear: 0, color: C.offWhite },
            { startX: 1180, startY: 675, endX: 540, endY: 675, appear: 15, color: C.offWhite },
            { startX: 540, startY: 200, endX: 540, endY: 675, appear: 30, color: C.offWhite },
            { startX: 540, startY: 1200, endX: 540, endY: 675, appear: 45, color: C.crimson },
          ];

          const signalLines = lf >= 30;

          return (
            <AbsoluteFill style={{ opacity: sceneIn }}>
              <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1350" width="1080" height="1350">
                {/* Campus environment suggestions */}
                {/* Tea stall */}
                <rect x="330" y="770" width="420" height="280" fill={C.deep} stroke={C.offWhite} strokeWidth="2.5" rx="4" />
                <line x1="380" y1="770" x2="380" y2="680" stroke={C.offWhite} strokeWidth="2.5" />
                <line x1="700" y1="770" x2="700" y2="680" stroke={C.offWhite} strokeWidth="2.5" />
                <line x1="380" y1="680" x2="700" y2="680" stroke={C.offWhite} strokeWidth="2.5" />

                {/* TEA sign (blinking) */}
                {lf % 14 < 10 ? (
                  <rect x="460" y="695" width="160" height="46" rx="6" fill={C.crimsonDim} stroke={C.crimson} strokeWidth="2" />
                ) : null}
                <text x="540" y="725" textAnchor="middle" fill={lf % 14 < 10 ? C.crimson : "rgba(255,255,255,0.1)"}
                  style={{ fontFamily: FONT_MONO, fontSize: "20px", fontWeight: 900, letterSpacing: "7px" }}>TEA</text>

                {/* Signal lines connecting (before physical meeting) */}
                {signalLines && convergePeople.map((p, i) => (
                  <line key={i}
                    x1={p.startX} y1={p.startY}
                    x2={540} y2={675}
                    stroke={p.color} strokeWidth="1.5" opacity={0.4} strokeDasharray="10 8"
                  />
                ))}

                {/* People converging */}
                {convergePeople.map((p, i) => {
                  const progress = lf >= p.appear ? ease(lf, [p.appear, p.appear + 50], [0, 1]) : 0;
                  const px = p.startX + (p.endX - p.startX) * progress;
                  const py = p.startY + (p.endY - p.startY) * progress;
                  return (
                    <g key={i} transform={`translate(${px},${py})`} opacity={lf >= p.appear ? ease(lf, [p.appear, p.appear + 15], [0, 1]) : 0}>
                      <Person scale={0.9} color={p.color}
                        headBob={Math.sin(lf * 0.18 + i) * 2}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* FIND YOUR PEOPLE — massive centered text */}
              {lf >= 70 && (
                <div style={{
                  position: "absolute", top: "95px",
                  width: "100%", textAlign: "center",
                  opacity: ease(lf, [70, 92], [0, 1]),
                  transform: `scale(${ease(lf, [70, 92], [0.92, 1])})`,
                }}>
                  <h1 style={{ color: C.offWhite, fontSize: "90px", fontWeight: 950, lineHeight: 1.0, letterSpacing: "-4px", margin: "0 50px" }}>
                    FIND YOUR PEOPLE.
                  </h1>
                </div>
              )}

              {/* Sub tag */}
              <div style={{
                position: "absolute", bottom: "95px", width: "100%", textAlign: "center",
                opacity: ease(lf, [0, 22], [0, 0.7]),
              }}>
                <span style={{ fontFamily: FONT_MONO, color: C.crimson, fontSize: "13px", letterSpacing: "5px", fontWeight: 800 }}>
                  COMMUNITY // LIVE
                </span>
              </div>
            </AbsoluteFill>
          );
        })()}

        {/* ================================================================= */}
        {/* SCENE 7 — OUTRO / EPILOGUE (760–1050 frames, 25.3–35.0s)          */}
        {/* ================================================================= */}
        {frame >= 760 && (() => {
          const lf = frame - 760;
          const sceneIn = ease(lf, [0, 22], [0, 1]);

          // Back on the rooftop
          const headBobA = Math.sin(lf * 0.10) * 1.5;
          const headBobB = Math.sin(lf * 0.08 + 1.2) * 1.2;

          // VO subtitle windows
          const showLine8 = lf >= 0 && lf < 90;    // "Jeevan saathi ka pata nahi…"
          const showLine9 = lf >= 78;               // "Abhi ka saathi mil jayega."

          // Logo drop at lf=128 (frame 888)
          const showLogo = lf >= 128;
          const logoScale = showLogo ? ease(lf, [128, 148], [1.35, 1.0]) : 0;
          const logoOpacity = showLogo ? ease(lf, [128, 145], [0, 1]) : 0;

          return (
            <AbsoluteFill style={{ opacity: sceneIn, background: C.black }}>
              {/* Return to rooftop characters — dimly lit, centered lower half */}
              {!showLogo && (
                <div style={{ position: "absolute", bottom: "200px", width: "100%", display: "flex", justifyContent: "center" }}>
                  <svg viewBox="0 0 600 280" width="560" height="260" style={{ overflow: "visible" }}>
                    <line x1="-100" y1="240" x2="700" y2="240" stroke={C.offWhite} strokeWidth="3" opacity={0.5} />
                    <line x1="-100" y1="258" x2="700" y2="258" stroke={C.offWhite} strokeWidth="2" opacity={0.2} strokeDasharray="10 8" />

                    <g transform="translate(160,210)" style={{ opacity: 0.65 }}>
                      <Person y={0} color={C.offWhite} headBob={headBobA} />
                    </g>
                    <g transform="translate(440,210) scale(-1,1)" style={{ opacity: 0.65 }}>
                      <Person y={0} color={C.offWhite} headBob={headBobB} />
                    </g>
                  </svg>
                </div>
              )}

              {/* Dialogue subtitle: line 8 */}
              {showLine8 && (
                <div style={{
                  position: "absolute", top: "110px",
                  width: "100%", textAlign: "center",
                  opacity: ease(lf, [0, 18], [0, 0.92]),
                }}>
                  <span style={{ color: C.offWhite, fontSize: "44px", fontWeight: 700, lineHeight: 1.2 }}>
                    "Jeevan saathi ka pata nahi…"
                  </span>
                </div>
              )}

              {/* Dialogue subtitle: line 9 — THE CRITICAL FINAL LINE */}
              {showLine9 && !showLogo && (
                <div style={{
                  position: "absolute", top: "110px",
                  width: "100%", textAlign: "center",
                  opacity: ease(lf, [78, 98], [0, 1]),
                  transform: `scale(${ease(lf, [78, 98], [0.92, 1])})`,
                }}>
                  <span style={{ color: C.crimson, fontSize: "52px", fontWeight: 950, lineHeight: 1.15, textShadow: `0 0 35px rgba(210,4,45,0.4)` }}>
                    "Abhi ka saathi mil jayega."
                  </span>
                </div>
              )}

              {/* ── LOGO HIT (lf ≥ 128) ── */}
              {showLogo && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "36px",
                  opacity: logoOpacity,
                  transform: `scale(${logoScale})`,
                }}>
                  {/* Stag emblem */}
                  <Stag size={290} showTriangle={true} />

                  {/* LOCKIN logotype */}
                  <h1 style={{
                    fontSize: "118px", fontWeight: 950, letterSpacing: "14px",
                    color: C.offWhite, lineHeight: 1.0, margin: 0, paddingLeft: "14px",
                  }}>
                    L<span style={{ color: C.crimson }}>O</span>CKIN
                  </h1>

                  {/* Tagline */}
                  {lf >= 148 && (
                    <span style={{
                      fontFamily: FONT_MONO, color: "rgba(237,235,222,0.45)",
                      fontSize: "16px", fontWeight: 700, letterSpacing: "9px",
                      opacity: ease(lf, [148, 175], [0, 1]),
                      marginTop: "-8px",
                    }}>
                      FIND YOUR PEOPLE.
                    </span>
                  )}
                </div>
              )}
            </AbsoluteFill>
          );
        })()}

      </div>
    </AbsoluteFill>
  );
};
