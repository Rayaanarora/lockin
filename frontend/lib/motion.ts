import type { Transition, Variants } from "framer-motion";

/*
 * LOCKIN motion system. One vocabulary for the whole app:
 *   snap: presses, toggles (fast, no overshoot)
 *   glide: entrances, tab changes (soft settle)
 *   pop: rewards, badges, confirmations (slight overshoot)
 * Exits are always faster than entrances.
 */
export const ease = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number]
};

export const spring = {
  snap: { type: "spring", stiffness: 600, damping: 38, mass: 0.6 } as Transition,
  glide: { type: "spring", stiffness: 260, damping: 30 } as Transition,
  pop: { type: "spring", stiffness: 520, damping: 34 } as Transition,
  card: { type: "spring", stiffness: 360, damping: 34 } as Transition
};

/** Container that staggers its children in. */
export const stagger = (each = 0.05, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: delay } }
});

/** Child of `stagger`: rise and fade. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.out } }
};

/** Child of `stagger`: scale in (bento tiles, chips). */
export const bloom: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: spring.glide }
};

/** Tab / screen transition. */
export const screen: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.38, ease: ease.out } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: ease.inOut } }
};

/** Bottom sheet. */
export const sheet: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: spring.glide },
  exit: { y: "100%", transition: { duration: 0.22, ease: ease.inOut } }
};

/** Shared press feedback for buttons and cards. */
export const press = { whileTap: { scale: 0.97 }, transition: spring.snap };
export const pressCard = { whileTap: { scale: 0.985 }, transition: spring.snap };
