"use client";

import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw, Search, WifiOff, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "./ui/motion";
import { spring } from "../lib/motion";
import { User, Post } from "../app/types";
import FeedPostCard from "./FeedPostCard";
import PostDetailModal from "./PostDetailModal";
import UserSearchModal from "./UserSearchModal";
import PublicProfile from "./PublicProfile";
import PostComposer from "./PostComposer";
import FeedRail from "./FeedRail";

interface SocialFeedProps {
  user: User;
  api: (path: string, options?: RequestInit) => Promise<any>;
  setTab?: (tab: string) => void;
}

export default function SocialFeed({ user, api, setTab }: SocialFeedProps) {
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
  const [composerOpen, setComposerOpen] = useState(false);

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
    <section className="mx-auto w-full max-w-[600px] flex-1 pt-2 md:pt-12 lg:max-w-[1080px] lg:px-12 2xl:max-w-[1360px]">
      <div className="lg:grid lg:grid-cols-[minmax(0,640px)_300px] lg:justify-between lg:gap-14 2xl:grid-cols-[minmax(0,780px)_360px] 2xl:gap-20">
      <div className="min-w-0">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 px-5 md:px-0">
        <div>
          <p className="t-section">Campus feed</p>
          <h1 className="t-display mt-3 text-large-title text-ink md:text-[56px] md:leading-none">Feed</h1>
        </div>
        <div className="flex gap-1">
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => setIsSearchOpen(true)} aria-label="Find people" className="flex h-11 w-11 items-center justify-center text-ink-2 transition-colors hover:text-ink">
            <Search className="h-5 w-5" strokeWidth={1.6} />
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => loadFeed(true)} disabled={loading} aria-label="Refresh feed" className="flex h-11 w-11 items-center justify-center text-ink-2 transition-colors hover:text-ink disabled:opacity-50">
            <motion.span animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={loading ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }} className="flex">
              <RefreshCw className="h-5 w-5" strokeWidth={1.6} />
            </motion.span>
          </motion.button>
        </div>
      </div>

      {/* Whose posts */}
      <div className="mt-5 flex border-b border-line px-5 md:px-0" role="tablist" aria-label="Feed filter">
        {[
          { key: "college", label: user.campus_name || "Campus" },
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
              className={`relative h-12 flex-1 truncate px-3 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors ${on ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
            >
              {tab.label}
              {on && <motion.span layoutId="feed-filter" className="absolute inset-x-0 bottom-0 h-px bg-ink" transition={spring.glide} />}
            </button>
          );
        })}
      </div>

      {/* Share something */}
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="flex w-full items-center gap-3 border-b border-line px-5 py-4 text-left transition-colors hover:bg-surface md:px-0 md:hover:bg-transparent"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full border border-line object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-footnote font-medium text-ink-2">
            {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="flex-1 text-subhead text-ink-3">What did you get done?</span>
        <span className="flex h-10 w-10 items-center justify-center text-ink-2" aria-hidden="true">
          <ImagePlus className="h-5 w-5" strokeWidth={1.6} />
        </span>
      </button>

      {/* Posts */}
      <div>
        {loading ? (
          <div>
            {[0, 1].map((i) => (
              <div key={i} className="space-y-3 border-b border-line px-5 py-5 md:px-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-16" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center px-8 py-16 text-center">
            <WifiOff className="h-8 w-8 text-ink-3" />
            <h2 className="t-display mt-4 text-title-1 text-ink">Feed didn&apos;t load</h2>
            <p className="mt-1.5 max-w-[260px] text-subhead text-ink-2">Check your connection and try again.</p>
            <button type="button" onClick={() => loadFeed(true)} className="btn-ghost mt-6 h-12 px-6">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center px-8 py-16 text-center">
            <h2 className="t-display text-title-1 text-ink">{filter === "following" ? "Nothing from people you follow" : "Quiet so far"}</h2>
            <p className="mt-2 max-w-[280px] text-subhead text-ink-2">
              {filter === "following"
                ? "Follow people from their profiles, or switch back to your campus."
                : "Finish a mission and share the recap, or post what you got done. You could be first."}
            </p>
            <button type="button" onClick={() => setComposerOpen(true)} className="btn-primary mt-6 h-12 px-7">
              New post
            </button>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 6) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <FeedPostCard
                    post={post}
                    currentUserId={user.id}
                    onReactionToggle={handleReactionToggle}
                    onCommentsClick={handleCommentsClick}
                    onDeletePost={handleDeletePost}
                    onOpenProfile={(id) => {
                      setSelectedProfileUserId(id);
                      setIsProfileOpen(true);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {hasMore ? (
              <div className="py-6 text-center">
                <button type="button" onClick={() => loadFeed(false)} disabled={loadingMore} className="btn-ghost h-12 px-6 disabled:opacity-50">
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loadingMore ? "Loading" : "Older posts"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-5 pb-8 pt-6 md:px-0">
                <span className="h-px flex-1 bg-line" />
                <p className="t-label">You&apos;re caught up</p>
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
          </>
        )}
      </div>

      </div>

      <div className="lg:sticky lg:top-12 lg:self-start lg:pt-[106px]">
        <FeedRail
          user={user}
          api={api}
          setTab={setTab}
          onOpenProfile={(id) => {
            setSelectedProfileUserId(id);
            setIsProfileOpen(true);
          }}
        />
      </div>
      </div>

      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        user={user}
        api={api}
        onPosted={(post) => {
          setPosts((cur) => [post, ...cur.filter((p) => p.id !== post.id)]);
        }}
      />

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
