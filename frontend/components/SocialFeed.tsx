"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Flame, RefreshCw, Search, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "./ui/motion";
import { spring } from "../lib/motion";
import { User, Post } from "../app/types";
import FeedPostCard from "./FeedPostCard";
import PostDetailModal from "./PostDetailModal";
import UserSearchModal from "./UserSearchModal";
import PublicProfile from "./PublicProfile";

interface SocialFeedProps {
  user: User;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

export default function SocialFeed({ user, api }: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<"everyone" | "following" | "college">("college");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Detail Modal State
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Search and Profile View states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load feed posts
  const loadFeed = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setLoadError(false);
      } else {
        setLoadingMore(true);
      }

      const activeCursor = reset ? null : cursor;
      const cursorParam = activeCursor ? `&cursor=${activeCursor}` : "";
      
      const data = await api(`/posts/feed?userId=${user.id}&filter=${filter}&limit=10${cursorParam}`);
      
      if (reset) {
        setPosts(data.posts || []);
      } else {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
      }

      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } catch (err) {
      console.error("Error loading feed posts:", err);
      if (reset) {
        setPosts([]);
        setLoadError(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(true);
  }, [filter]);

  // Handle reaction toggle
  const handleReactionToggle = async (postId: number, emoji: "🔥" | "💀" | "❤️" | "🧠") => {
    // Optimistic UI updates
    setPosts((currentPosts) =>
      currentPosts.map((p) => {
        if (p.id !== postId) return p;

        const hasReacted = p.userReactions[emoji];
        const countDiff = hasReacted ? -1 : 1;

        return {
          ...p,
          userReactions: {
            ...p.userReactions,
            [emoji]: !hasReacted
          },
          reactionCounts: {
            ...p.reactionCounts,
            [emoji]: Math.max(0, (p.reactionCounts[emoji] || 0) + countDiff)
          }
        };
      })
    );

    try {
      const data = await api(`/posts/${postId}/react`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id, emoji })
      });

      // Update with exact counts from database
      setPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            reactionCounts: data.reactionCounts,
            userReactions: data.userReactions
          };
        })
      );
    } catch (err) {
      console.error("Failed to toggle reaction");
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await api(`/posts/${postId}?userId=${user.id}`, {
        method: "DELETE"
      });

      // Filter out post locally
      setPosts((current) => current.filter((p) => p.id !== postId));
    } catch (err: any) {
      console.error("Error deleting post:", err);
      alert(err.message || "Failed to delete post.");
    }
  };

  const handleCommentsClick = (post: Post) => {
    setSelectedPostId(post.id);
    setIsDetailOpen(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((current) => current.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  return (
    <section className="mx-auto w-full max-w-md flex-1 px-5 pt-2 md:max-w-[1240px] md:px-12 md:pt-12">
      <div className="mb-8 hidden border-b border-line pb-8 md:block">
        <p className="t-section">Feed · Campus</p>
        <h1 className="t-display mt-3 text-[48px] leading-none text-ink">Feed</h1>
        <p className="mt-2 text-subhead text-ink-3">What your campus actually got done.</p>
      </div>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_300px] md:gap-12">
        {/* ── Left rail ── */}
        <div className="md:sticky md:top-12 md:order-2 md:self-start">
          <div className="flex items-end justify-between gap-4 md:block">
            <div>
              <p className="t-section md:hidden">Feed · Campus</p>
              <h1 className="t-display mt-3 text-large-title text-ink md:hidden">Feed</h1>
                          </div>
            <div className="flex gap-2 md:hidden">
              <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => setIsSearchOpen(true)} aria-label="Search people" className="btn-ghost h-11 w-11 tracking-normal">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </motion.button>
              <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => loadFeed(true)} disabled={loading} aria-label="Refresh feed" className="btn-ghost h-11 w-11 tracking-normal">
                <motion.span animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={loading ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }} className="flex">
                  <RefreshCw className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </motion.span>
              </motion.button>
            </div>
          </div>

          <p className="t-label mt-0 hidden border-b border-line pb-3 md:block">Show</p>
          <div className="mt-5 flex rounded-sm border border-line p-1 md:mt-0 md:flex-col md:border-0 md:p-0" role="tablist" aria-label="Feed filter">
            {[
              { key: "college", label: user.college ? user.college.split(" ").slice(0, 3).join(" ") : "Campus" },
              { key: "following", label: "Following" }
            ].map((tab) => {
              const on = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(tab.key as any)}
                  className={`relative h-10 min-w-0 flex-1 rounded-sm px-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors md:flex md:h-14 md:flex-none md:items-center md:justify-between md:border-b md:border-line md:px-0 md:text-left ${on ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
                >
                  {on && <motion.span layoutId="feed-filter" className="absolute inset-0 rounded-sm bg-raised shadow-[inset_0_-1px_0_rgb(var(--signal))] md:bg-transparent md:shadow-none" transition={spring.glide} />}
                  <span className="relative block truncate">{tab.label}</span>
                  {on && <span className="relative hidden h-px w-8 bg-signal md:block" />}
                </button>
              );
            })}
          </div>

          {/* Desktop: people search + refresh live in the rail */}
          <div className="mt-8 hidden gap-3 md:grid md:grid-cols-[1fr_auto]">
            <button type="button" onClick={() => setIsSearchOpen(true)} className="btn-ghost h-12 justify-start px-4">
              <Search className="h-4 w-4" strokeWidth={1.5} /> Find people
            </button>
            <button type="button" onClick={() => loadFeed(true)} disabled={loading} aria-label="Refresh feed" className="btn-ghost h-12 w-12 tracking-normal">
              <motion.span animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={loading ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }} className="flex">
                <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
              </motion.span>
            </button>
          </div>
        </div>

        {/* ── Posts: the hero column ── */}
        <div className="min-w-0 md:order-1">
      <div className="mt-5 flex-1 md:mt-0">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-3 rounded-card border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-40" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center rounded-card border border-dashed border-line px-8 py-16 text-center">
            <WifiOff className="h-8 w-8 text-ink-3" />
            <h2 className="t-display mt-4 text-title-1 text-ink">Feed didn&apos;t load</h2>
            <p className="mt-1.5 max-w-[260px] text-subhead text-ink-2">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => loadFeed(true)}
              className="mt-6 flex h-12 items-center gap-2 rounded-xl border border-line bg-raised px-5 text-subhead font-semibold text-ink transition-colors hover:bg-overlay"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center rounded-card border border-dashed border-line px-8 py-16 text-center">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Flame className="h-9 w-9 text-crimson" />
            </motion.div>
            <h2 className="t-display mt-4 text-title-1 text-ink">Quiet so far</h2>
            <p className="mt-1.5 max-w-[260px] text-subhead text-ink-2">
              {filter === "following" ? "People you follow haven't posted yet." : "Finish a mission and share the recap. You could be first."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 6) * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                >
                  <FeedPostCard post={post} currentUserId={user.id} onReactionToggle={handleReactionToggle} onCommentsClick={handleCommentsClick} onDeletePost={handleDeletePost} />
                </motion.div>
              ))}
            </AnimatePresence>

            {!hasMore && (
              <div className="flex items-center gap-4 pb-6 pt-4">
                <span className="h-px flex-1 bg-line" />
                <p className="t-label">You&apos;re caught up · {posts.length} {posts.length === 1 ? "post" : "posts"}</p>
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            {!hasMore && posts.length < 4 && (
              <p className="pb-8 text-center text-subhead text-ink-3">Finish a mission and share the recap. It lands here for your campus.</p>
            )}

            {hasMore && (
              <div className="pb-4 pt-2 text-center">
                <button
                  type="button"
                  onClick={() => loadFeed(false)}
                  disabled={loadingMore}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-surface px-6 text-subhead font-semibold text-ink-2 transition-colors hover:text-ink disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loadingMore ? "Loading" : "Older posts"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

        </div>
      </div>

      {selectedPostId && (
        <PostDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedPostId(null);
          }}
          postId={selectedPostId}
          currentUserId={user.id}
          api={api}
          onReactionToggle={handleReactionToggle}
          onPostUpdated={handlePostUpdated}
        />
      )}

      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUserId={user.id}
        api={api}
        onViewProfile={(profileId) => {
          setSelectedProfileUserId(profileId);
          setIsProfileOpen(true);
        }}
      />

      {selectedProfileUserId && (
        <PublicProfile
          userId={selectedProfileUserId}
          viewerId={user.id}
          isOpen={isProfileOpen}
          onClose={() => {
            setIsProfileOpen(false);
            setSelectedProfileUserId(null);
          }}
          api={api}
        />
      )}
    </section>
  );
}
