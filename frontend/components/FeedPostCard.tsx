"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Globe, Users, UserCheck, Trash2, X, ChevronLeft, ChevronRight, Clock, CheckCircle2, Flame, Heart } from "lucide-react";
import { Post } from "../app/types";
import { spring } from "../lib/motion";

type Emoji = "🔥" | "💀" | "❤️" | "🧠";

interface FeedPostCardProps {
  post: Post;
  currentUserId: number;
  onReactionToggle: (postId: number, emoji: Emoji) => void;
  onCommentsClick: (post: Post) => void;
  onDeletePost?: (postId: number) => void;
}

const REACTIONS: { emoji: Emoji; label: string }[] = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "🧠", label: "Big brain" },
  { emoji: "❤️", label: "Love" },
  { emoji: "💀", label: "Dead" }
];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ───────────── Lightbox ───────────── */

function Lightbox({ images, index, setIndex, onClose }: { images: string[]; index: number; setIndex: (i: number) => void; onClose: () => void }) {
  const [dir, setDir] = useState(0);
  const go = useCallback(
    (d: number) => {
      const n = index + d;
      if (n < 0 || n >= images.length) return;
      setDir(d);
      setIndex(n);
    },
    [index, images.length, setIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/80 text-ink">
        <X className="h-5 w-5" />
      </button>

      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.img
          key={index}
          src={images[index]}
          alt={`Image ${index + 1} of ${images.length}`}
          custom={dir}
          initial={{ opacity: 0, x: dir * 80, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: dir * -80, scale: 0.96 }}
          transition={spring.glide}
          drag={images.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(1);
            if (info.offset.x > 60) go(-1);
          }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] max-w-full cursor-grab rounded-xl object-contain active:cursor-grabbing"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          {index > 0 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/80 text-ink">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < images.length - 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/80 text-ink">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, i) => (
              <motion.span key={i} animate={{ width: i === index ? 20 : 6, opacity: i === index ? 1 : 0.4 }} className="h-1.5 rounded-full bg-ink" />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ───────────── Image grid ───────────── */

function ImageGrid({ images, onDoubleTap }: { images: string[]; onDoubleTap: () => void }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [heart, setHeart] = useState(0);
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!images.length) return null;
  const count = images.length;

  const tap = (i: number) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (timer.current) clearTimeout(timer.current);
      lastTap.current = 0;
      setHeart((h) => h + 1);
      onDoubleTap();
      return;
    }
    lastTap.current = now;
    timer.current = setTimeout(() => setLightbox(i), 280);
  };

  const Tile = ({ i, className = "" }: { i: number; className?: string }) => (
    <button type="button" onClick={() => tap(i)} aria-label={`Open image ${i + 1}`} className={`relative block overflow-hidden bg-raised ${className}`}>
      <img src={images[i]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
      {i === 3 && count > 4 && (
        <span className="t-display absolute inset-0 flex items-center justify-center bg-black/60 text-title-1 text-ink">+{count - 4}</span>
      )}
    </button>
  );

  return (
    <>
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {count === 1 && <Tile i={0} className="h-full w-full" />}
        {count === 2 && (
          <div className="grid h-full grid-cols-2 gap-0.5">
            <Tile i={0} className="h-full" />
            <Tile i={1} className="h-full" />
          </div>
        )}
        {count === 3 && (
          <div className="grid h-full gap-0.5" style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr" }}>
            <Tile i={0} className="row-span-2 h-full" />
            <Tile i={1} className="h-full" />
            <Tile i={2} className="h-full" />
          </div>
        )}
        {count >= 4 && (
          <div className="grid h-full grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <Tile key={i} i={i} className="h-full" />
            ))}
          </div>
        )}

        {/* Double-tap burst */}
        <AnimatePresence>
          {heart > 0 && (
            <motion.span
              key={heart}
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-[88px]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.4, opacity: 0, y: -40, transition: { duration: 0.35 } }}
              transition={{ duration: 0.45 }}
              onAnimationComplete={() => setTimeout(() => setHeart(0), 250)}
              aria-hidden="true"
            >
              🔥
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>{lightbox !== null && <Lightbox images={images} index={lightbox} setIndex={setLightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
    </>
  );
}

/* ───────────── Like Button ───────────── */

function LikeButton({ count, active, onClick }: { count: number; active: boolean; onClick: () => void }) {
  const [bursts, setBursts] = useState<number[]>([]);
  return (
    <motion.button
      type="button"
      onClick={() => {
        if (!active) setBursts((b) => [...b, Date.now()]);
        onClick();
      }}
      whileTap={{ scale: 0.85 }}
      transition={spring.snap}
      aria-pressed={active}
      aria-label={`Like, ${count}`}
      className={`relative flex h-9 items-center gap-1.5 rounded-sm border px-3 transition-colors ${
        active ? "border-crimson/60 bg-crimson/10 text-crimson" : "border-line bg-raised text-ink-2 hover:border-ink-3/40 hover:text-ink"
      }`}
    >
      <Heart
        className={`h-4 w-4 transition-transform ${active ? "fill-crimson text-crimson scale-110" : "text-ink-2"}`}
        strokeWidth={1.75}
      />
      <span className="relative h-4 min-w-[1ch] overflow-hidden text-footnote font-semibold leading-4">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={count} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.18 }} className="tabular block">
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
      {bursts.map((b) => (
        <motion.span
          key={b}
          className="pointer-events-none absolute left-3 top-0"
          initial={{ y: 0, opacity: 1, scale: 0.8 }}
          animate={{ y: -36, opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={() => setBursts((all) => all.filter((x) => x !== b))}
          aria-hidden="true"
        >
          <Heart className="h-4 w-4 fill-crimson text-crimson" />
        </motion.span>
      ))}
    </motion.button>
  );
}

/* ───────────── Card ───────────── */

export default function FeedPostCard({ post, currentUserId, onReactionToggle, onCommentsClick, onDeletePost }: FeedPostCardProps) {
  const { id, userId, imageUrl, imageUrls, caption, visibility, createdAt, user, recap, commentCount, reactionCounts, userReactions } = post;
  const isOwner = userId === currentUserId;
  const images: string[] = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
  const VisIcon = visibility === "followers" ? Users : visibility === "college" ? UserCheck : Globe;
  const visLabel = visibility === "followers" ? "Followers" : visibility === "college" ? "Campus" : "Everyone";

  const totalLikes = Object.values(reactionCounts || {}).reduce((a, b) => a + b, 0);
  const hasLiked = Object.values(userReactions || {}).some(Boolean);

  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-ink-3/30">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3.5 md:px-6 md:py-5">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full border border-line object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-raised font-display text-title-3 font-bold text-ink">{initials}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-subhead font-semibold leading-tight text-ink">{user?.name || "Unknown"}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-footnote text-ink-3">
            <span className="truncate">{user?.department || "Student"}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={createdAt} title={new Date(createdAt).toLocaleString()}>{timeAgo(createdAt)}</time>
            <VisIcon className="h-3.5 w-3.5 shrink-0" aria-label={visLabel} />
          </p>
        </div>
        {isOwner && onDeletePost && (
          <button type="button" onClick={() => onDeletePost(id)} aria-label="Delete post" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-crimson">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      <ImageGrid images={images} onDoubleTap={() => !hasLiked && onReactionToggle(id, "❤️")} />

      {/* Recap */}
      {recap && (
        <div className="relative mx-4 mt-4 overflow-hidden rounded-xl border border-line bg-bg p-4 md:mx-6 md:p-6">
          <p className="t-label relative flex items-center gap-1.5 text-crimson">
            <Flame className="h-3.5 w-3.5" /> Session recap
          </p>
          <p className="t-display relative mt-1.5 line-clamp-2 text-title-2 text-ink md:text-[30px]">{recap.missionTitle || "Focus session"}</p>
          <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-subhead text-ink-2">
            {recap.sessionDuration != null && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-ink-3" />
                {recap.sessionDuration} min
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-ink-3" />
              {recap.tasksCompleted ?? 0} {(recap.tasksCompleted ?? 0) === 1 ? "task" : "tasks"}
            </span>
            {!!recap.streak && (
              <span className="flex items-center gap-1.5 text-crimson">
                <Flame className="h-4 w-4" />
                {recap.streak}-day streak
              </span>
            )}
            {recap.categorySnapshot && <span className="text-ink-3">{recap.categorySnapshot}</span>}
          </div>
        </div>
      )}

      {caption && <p className="px-4 pt-3 text-subhead leading-relaxed text-ink md:px-6 md:pt-4 md:text-[17px]">{caption}</p>}

      {/* Actions */}
      <footer className="flex items-center gap-2 px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">
        <LikeButton
          count={totalLikes}
          active={hasLiked}
          onClick={() => onReactionToggle(id, "❤️")}
        />
        <button
          type="button"
          onClick={() => onCommentsClick(post)}
          className="relative ml-auto flex h-11 shrink-0 items-center gap-1.5 rounded-sm px-2 text-subhead text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          aria-label={`${commentCount} comments`}
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="tabular">{commentCount}</span>
        </button>
      </footer>
    </article>
  );
}
