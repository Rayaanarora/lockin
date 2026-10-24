"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { fieldClass } from "./ui/input";
import { Skeleton } from "./ui/motion";
import { spring } from "../lib/motion";
import { Post, Comment } from "../app/types";
import FeedPostCard from "./FeedPostCard";

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  currentUserId: number;
  api: (path: string, options?: RequestInit) => Promise<any>;
  onReactionToggle: (postId: number, emoji: "🔥" | "💀" | "❤️" | "🧠") => void;
  onPostUpdated: (updatedPost: Post) => void;
}

export default function PostDetailModal({
  isOpen,
  onClose,
  postId,
  currentUserId,
  api,
  onReactionToggle,
  onPostUpdated
}: PostDetailModalProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch post details & comments
  const loadPostDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api(`/posts/${postId}?userId=${currentUserId}`);
      setPost(data);
      setComments(data.comments || []);
    } catch (err: any) {
      console.error("Error loading post detail:", err);
      setError(err.message || "Failed to load post details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      loadPostDetails();
    }
  }, [isOpen, postId]);

  // Scroll to bottom of comments when comments list changes
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const data = await api(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          userId: currentUserId,
          text: newComment.trim()
        })
      });

      // Append comment
      setComments((prev) => [...prev, data]);
      setNewComment("");

      // Update parent feed post comment count
      if (post) {
        const updated = {
          ...post,
          commentCount: post.commentCount + 1
        };
        setPost(updated);
        onPostUpdated(updated);
      }
    } catch (err: any) {
      console.error("Error adding comment:", err);
      alert(err.message || "Failed to add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactionLocal = (postId: number, emoji: "🔥" | "💀" | "❤️" | "🧠") => {
    if (!post) return;
    
    // Call parent handler to make request
    onReactionToggle(postId, emoji);

    // Toggle local state
    const hasReacted = post.userReactions[emoji];
    const updatedUserReactions = {
      ...post.userReactions,
      [emoji]: !hasReacted
    };
    const updatedReactionCounts = {
      ...post.reactionCounts,
      [emoji]: post.reactionCounts[emoji] + (hasReacted ? -1 : 1)
    };

    const updatedPost = {
      ...post,
      userReactions: updatedUserReactions,
      reactionCounts: updatedReactionCounts
    };

    setPost(updatedPost);
    onPostUpdated(updatedPost);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg sm:p-0">
        <DialogHeader className="border-b border-line px-5 pb-4 pt-5">
          <DialogTitle>Post</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-64" />
              <Skeleton className="h-10" />
            </div>
          ) : error || !post ? (
            <p className="py-12 text-center text-subhead text-ink-2">{error || "Couldn't load this post."}</p>
          ) : (
            <>
              <FeedPostCard post={post} currentUserId={currentUserId} onReactionToggle={handleReactionLocal} onCommentsClick={() => {}} />

              <div>
                <p className="t-label mb-4">
                  {comments.length} comment{comments.length === 1 ? "" : "s"}
                </p>
                {comments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line py-8 text-center text-subhead text-ink-3">No comments yet. Say something.</p>
                ) : (
                  <ul className="space-y-4">
                    <AnimatePresence initial={false}>
                      {comments.map((c) => {
                        const ci = c.user?.name ? c.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
                        const mine = c.user?.id === currentUserId;
                        return (
                          <motion.li
                            key={c.id}
                            layout
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={spring.glide}
                            className="flex items-start gap-3"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-raised font-display text-title-3 font-bold text-ink">{ci}</span>
                            <div className={`min-w-0 flex-1 rounded-2xl rounded-tl-md border px-3.5 py-2.5 ${mine ? "border-signal/70 bg-signal/[0.06]" : "border-line bg-raised"}`}>
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-subhead font-semibold text-ink">{c.user?.name || "Student"}</span>
                                <time className="shrink-0 text-caption text-ink-3" dateTime={c.createdAt}>
                                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </time>
                              </div>
                              <p className="mt-0.5 break-words text-subhead leading-relaxed text-ink-2">{c.text}</p>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={commentsEndRef} />
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {post && !loading && (
          <form onSubmit={handleSendComment} className="safe-bottom flex items-center gap-2 border-t border-line bg-surface px-4 pt-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, 300))}
                placeholder="Add a comment"
                aria-label="Add a comment"
                className={`${fieldClass} h-12 pr-14`}
              />
              {newComment.length > 240 && (
                <span className={`tabular absolute right-3 top-1/2 -translate-y-1/2 text-caption ${newComment.length >= 300 ? "text-crimson" : "text-ink-3"}`}>
                  {300 - newComment.length}
                </span>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={submitting || !newComment.trim()}
              whileTap={{ scale: 0.88 }}
              animate={newComment.trim() ? { scale: 1, opacity: 1 } : { scale: 0.92, opacity: 0.5 }}
              transition={spring.snap}
              aria-label="Send"
              className="flex h-12 w-12 shrink-0 items-center justify-center btn-primary"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </motion.button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
