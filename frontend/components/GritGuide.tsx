"use client";

import React, { useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { POINTS_NAME } from "../lib/brand";

/*
 * What Grit is and how the app works, in one screen. Numbers mirror the server:
 * recapController.finishSession and missionController.submitVibeCheck /
 * submitAttendance. Keep them in sync if the rules change.
 */
const EARN = [
  { delta: "+10", text: "Finish a solo focus session" },
  { delta: "+10", text: "Show up and finish a mission with someone" },
  { delta: "+2", text: "Your partner rates you W after the session" },
  { delta: "+5", text: "Host a mission someone completes" }
];
const LOSE = [
  { delta: "−5", text: "Don't show up, or crash a session (quit in under 3 min, or under half your target with nothing done)" },
  { delta: "−1", text: "Your partner rates you L" }
];
const STEPS = [
  "Swipe right on a mission to lock in. Hosts approve who joins.",
  "Check in on the Queue with the host's 4-digit code when you arrive (it opens 15 min before).",
  "Finish the session, then rate each other once: W if they showed up, L if they didn't."
];

export default function GritGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // Start reading at the top: by default focus (and scroll) would jump to "Got it".
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-lg" initialFocus={titleRef}>
        <DialogHeader>
          <p className="t-section text-crimson">How it works</p>
          <DialogTitle ref={titleRef} tabIndex={-1} className="t-display mt-2 text-title-1 text-ink outline-none">{POINTS_NAME} is proof you show up</DialogTitle>
          <DialogDescription className="mt-2 text-subhead leading-relaxed text-ink-2">
            Everyone starts with 100. It goes up when you do the work and down when you flake. Anyone on your campus can see it.
          </DialogDescription>
        </DialogHeader>

        <section className="mt-6" aria-labelledby="grit-earn">
          <h3 id="grit-earn" className="t-label">You earn</h3>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {EARN.map((r) => (
              <li key={r.text} className="flex items-baseline gap-4 py-3">
                <span className="tabular w-10 shrink-0 text-headline text-ink">{r.delta}</span>
                <span className="text-subhead text-ink-2">{r.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6" aria-labelledby="grit-lose">
          <h3 id="grit-lose" className="t-label">You lose</h3>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {LOSE.map((r) => (
              <li key={r.text} className="flex items-baseline gap-4 py-3">
                <span className="tabular w-10 shrink-0 text-headline text-crimson">{r.delta}</span>
                <span className="text-subhead text-ink-2">{r.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6" aria-labelledby="grit-flow">
          <h3 id="grit-flow" className="t-label">A mission, start to finish</h3>
          <ol className="mt-3 space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-subhead text-ink-2">
                <span className="tabular shrink-0 text-ink">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-footnote text-ink-3">You can have up to 3 missions open at once. Finish one to lock in to another.</p>
        </section>

        <button type="button" onClick={() => onOpenChange(false)} className="btn-primary mt-8 h-12 w-full">
          Got it
        </button>
      </DialogContent>
    </Dialog>
  );
}
