"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Trash2, X, ChevronLeft, ChevronRight, Heart, MoreHorizontal } from "lucide-react";
import { Post } from "../app/types";
import { spring } from "../lib/motion";

type Emoji = "🔥" | "💀" | "❤️" | "🧠";

interface FeedPostCardProps {
  post: Post;
  currentUserId: number;
  onReactionToggle: (postId: number, emoji: Emoji) => void;
  onCommentsClick: (post: Post) => void;
  onDeletePost?: (postId: number) => void;
  onOpenProfile?: (userId: number) => void;
}


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
              <Heart className="h-24 w-24 fill-signal text-signal drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]" strokeWidth={1.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>{lightbox !== null && <Lightbox images={images} index={lightbox} setIndex={setLightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
    </>
  );
}

/* ───────────── Card ───────────── */

/** "47 min" focused, "3" tasks, "5-day" streak: the proof, set large. */
function Proof({ recap }: { recap: NonNullable<Post["recap"]> }) {
  const stats = [
    { label: "Focused", value: recap.sessionDuration ?? 0, unit: "min", show: recap.sessionDuration != null },
    { label: "Tasks", value: recap.tasksCompleted ?? 0, unit: "", show: true },
    { label: "Streak", value: recap.streak ?? 0, unit: recap.streak === 1 ? "day" : "days", show: !!recap.streak }
  ].filter((s) => s.show);
  return (
    <div className="px-4 pt-4 md:px-0">
      <p className="t-label">Completed{recap.categorySnapshot ? ` · ${recap.categorySnapshot}` : ""}</p>
      <p className="t-display mt-1.5 line-clamp-2 text-title-1 text-ink">{recap.missionTitle || "Focus session"}</p>
      <dl className="mt-4 grid border-y border-line" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
        {stats.map((s, i) => (
          <div key={s.label} className={`py-3 ${i > 0 ? "border-l border-line pl-4" : ""}`}>
            <dt className="t-label">{s.label}</dt>
            <dd className="mt-1 flex items-baseline gap-1">
              <span className={`t-display tabular text-[34px] leading-none ${s.label === "Streak" && s.value >= 2 ? "text-crimson-display" : "text-ink"}`}>{s.value}</span>
              {s.unit && <span className="text-footnote text-ink-3">{s.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function FeedPostCard({ post, currentUserId, onReactionToggle, onCommentsClick, onDeletePost, onOpenProfile }: FeedPostCardProps) {
  const { id, userId, imageUrl, imageUrls, caption, visibility, createdAt, user, recap, commentCount, reactionCounts, userReactions } = post;
  const isOwner = userId === currentUserId;
  const images: string[] = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
  const visLabel = visibility === "followers" ? "Followers" : visibility === "college" ? "Campus" : "Everyone";
  const [menuOpen, setMenuOpen] = useState(false);

  const totalLikes = Object.values(reactionCounts || {}).reduce((a, b) => a + b, 0);
  const liked = !!userReactions?.["❤️"];
  const [pop, setPop] = useState(0);
  // A recap shared without a reflection gets "Completed: <title>" as its caption; the proof block already says that.
  const autoCaption = !!recap && !!caption && /^(Completed|Crashed): /.test(caption) && caption.endsWith(recap.missionTitle || "");
  const shownCaption = autoCaption ? "" : caption;

  function like() {
    if (!liked) setPop((n) => n + 1);
    onReactionToggle(id, "❤️");
  }

  return (
    <article className="border-b border-line pb-5 pt-4">
      {/* Who */}
      <header className="flex items-center gap-3 px-4 md:px-0">
        <button
          type="button"
          onClick={() => user && onOpenProfile?.(user.id)}
          aria-label={`View ${user?.name || "profile"}`}
          className="shrink-0 rounded-full"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-line object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raised text-footnote font-medium text-ink-2">{initials}</span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-subhead leading-tight">
            <button type="button" onClick={() => user && onOpenProfile?.(user.id)} className="font-medium text-ink hover:underline">
              {user?.name || "Unknown"}
            </button>
            {user?.username && <span className="text-ink-3"> @{user.username}</span>}
          </p>
          <p className="mt-0.5 truncate text-footnote text-ink-3">
            <time dateTime={createdAt} title={new Date(createdAt).toLocaleString()}>{timeAgo(createdAt)}</time>
            {" · "}
            {user?.department || "Student"}
            {" · "}
            {visLabel}
          </p>
        </div>
        {isOwner && onDeletePost && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Post options"
              aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center text-ink-3 transition-colors hover:text-ink"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                  className="absolute right-0 top-11 z-20 min-w-[160px] border border-line bg-surface py-1 shadow-lift"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDeletePost(id);
                    }}
                    className="flex h-11 w-full items-center gap-2.5 px-4 text-left text-subhead text-crimson hover:bg-raised"
                  >
                    <Trash2 className="h-4 w-4" /> Delete post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </header>

      {/* What they did */}
      {recap && <Proof recap={recap} />}

      {images.length > 0 && (
        <div className="mt-4 md:overflow-hidden md:rounded-[4px] md:border md:border-line">
          <ImageGrid images={images} onDoubleTap={() => !liked && like()} />
        </div>
      )}

      {/* Actions, Instagram order: act first, then counts, then words */}
      <div className="mt-2 flex items-center px-2 md:-mx-2.5">
        <motion.button
          type="button"
          onClick={like}
          whileTap={{ scale: 0.85 }}
          transition={spring.snap}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          className="relative flex h-11 w-11 items-center justify-center"
        >
          <motion.span key={pop} initial={pop ? { scale: 0.6 } : false} animate={{ scale: 1 }} transition={spring.pop} className="flex">
            <Heart className={`h-6 w-6 transition-colors ${liked ? "fill-signal text-signal" : "text-ink"}`} strokeWidth={1.6} />
          </motion.span>
        </motion.button>
        <button
          type="button"
          onClick={() => onCommentsClick(post)}
          aria-label={`Comment${commentCount ? `, ${commentCount} comments` : ""}`}
          className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-ink-2"
        >
          <MessageCircle className="h-6 w-6 -scale-x-100" strokeWidth={1.6} />
        </button>
      </div>

      <div className="space-y-1 px-4 md:px-0">
        {totalLikes > 0 && (
          <p className="tabular text-subhead font-medium text-ink">
            {totalLikes} {totalLikes === 1 ? "like" : "likes"}
          </p>
        )}
        {shownCaption && (
          <p className="text-subhead leading-relaxed text-ink-2">
            <span className="font-medium text-ink">{user?.username || user?.name?.split(" ")[0]}</span> {shownCaption}
          </p>
        )}
        {commentCount > 0 ? (
          <button type="button" onClick={() => onCommentsClick(post)} className="h-8 text-subhead text-ink-3 transition-colors hover:text-ink-2">
            {commentCount === 1 ? "View 1 comment" : `View all ${commentCount} comments`}
          </button>
        ) : (
          <button type="button" onClick={() => onCommentsClick(post)} className="h-8 text-subhead text-ink-3 transition-colors hover:text-ink-2">
            Add a comment…
          </button>
        )}
      </div>
    </article>
  );
}
