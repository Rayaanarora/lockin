"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Globe, Users, UserCheck, Trash2 } from "lucide-react";
import { Post } from "../app/types";

interface FeedPostCardProps {
  post: Post;
  currentUserId: number;
  onReactionToggle: (postId: number, emoji: "🔥" | "💀" | "❤️" | "🧠") => void;
  onCommentsClick: (post: Post) => void;
  onDeletePost?: (postId: number) => void;
}

export default function FeedPostCard({
  post,
  currentUserId,
  onReactionToggle,
  onCommentsClick,
  onDeletePost
}: FeedPostCardProps) {
  const {
    id,
    userId,
    imageUrl,
    caption,
    visibility,
    createdAt,
    user,
    recap,
    commentCount,
    reactionCounts,
    userReactions
  } = post;

  const isOwner = userId === currentUserId;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + ", " + new Date(createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const displayDate = formattedDate.toUpperCase();

  const getVisibilityIcon = () => {
    switch (visibility) {
      case "everyone":
        return <Globe size={11} className="text-zinc-600" />;
      case "followers":
        return <Users size={11} className="text-zinc-600" />;
      case "college":
        return <UserCheck size={11} className="text-zinc-600" />;
      default:
        return <Globe size={11} className="text-zinc-600" />;
    }
  };

  // Stat Card fields
  const missionTitle = recap?.missionTitle || "Focus Session";
  const duration = recap?.sessionDuration || 25;
  const category = recap?.categorySnapshot || "Development";
  const tasksCompleted = recap?.tasksCompleted || 0;
  const streak = recap?.streak || 0;

  // List of reactions
  const reactionList = [
    { emoji: "🔥" as const, label: "Fire" },
    { emoji: "💀" as const, label: "Skull" },
    { emoji: "❤️" as const, label: "Heart" },
    { emoji: "🧠" as const, label: "Brain" }
  ];

  return (
    <div className="relative bg-zinc-950 border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/[0.14] transition-colors duration-200 text-left w-full flex flex-col">
      {/* Section 1 — Header */}
      <div className="flex items-center px-4 pt-4 pb-3">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || "User"}
              className="w-9 h-9 rounded-full object-cover border border-[#8B0000]/50 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-[#8B0000]/50 text-[11px] font-black text-[#8B0000] flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-black text-white uppercase tracking-wide truncate">
              {user?.name || "Unknown"}
            </h4>
            <p className="text-[10px] text-zinc-500 font-bold truncate leading-none mt-0.5">
              {user?.department || "Student"} &middot; {user?.college || "Campus"}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
            {displayDate}
          </span>
          <div className="flex items-center gap-1.5">
            {getVisibilityIcon()}
            {isOwner && onDeletePost && (
              <button
                onClick={() => onDeletePost(id)}
                className="text-zinc-600 hover:text-[#8B0000] transition-colors"
                title="Delete post"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 2 — Image */}
      {imageUrl && (
        <div className="w-full border-b border-white/[0.06] overflow-hidden">
          <img src={imageUrl} alt="Attached" className="w-full aspect-square object-cover" />
        </div>
      )}

      {/* Section 3 — Stat mini-card */}
      <div className="relative bg-black border border-white/[0.08] rounded-xl p-4 mx-4 mt-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#8B0000] rounded-l-xl" />
        <div className="pl-2 flex justify-between items-center w-full">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B0000]">
              FOCUS RECAP VERIFIED
            </span>
            <h4 className="text-sm font-black text-white uppercase tracking-wide truncate max-w-[180px] mt-1.5">
              {missionTitle}
            </h4>
            <p className="text-[11px] font-bold text-zinc-500 uppercase mt-1">
              {duration} MINUTES &middot; {category}
            </p>
          </div>
          <div className="flex gap-4 shrink-0 text-right">
            <div>
              <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-wider">TASKS</span>
              <span className="text-[12px] font-black text-white">{tasksCompleted} Done</span>
            </div>
            <div>
              <span className="block text-[8px] font-black text-zinc-600 uppercase tracking-wider">STREAK</span>
              <span className="text-[12px] font-black text-white">{streak} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 — Caption */}
      {caption && (
        <p className="px-4 mt-3 text-sm font-bold text-zinc-300 leading-relaxed">
          {caption}
        </p>
      )}

      {/* Section 5 — Reactions + Comments row */}
      <div className="px-4 mt-3 pb-4 flex items-center justify-between">
        {/* Reactions left side */}
        <div className="flex flex-wrap gap-2">
          {reactionList.map(({ emoji, label }) => {
            const count = reactionCounts?.[emoji] ?? 0;
            const hasReacted = userReactions?.[emoji] ?? false;
            const isFaded = count === 0 && !hasReacted;

            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onReactionToggle(id, emoji)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-black border transition-all duration-150 outline-none select-none
                  ${isFaded ? "opacity-40" : ""}
                  ${
                    hasReacted
                      ? "bg-[#8B0000]/20 border-[#8B0000]/50 text-white"
                      : "bg-zinc-900 border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white"
                  }
                `}
                title={`${label} reaction`}
              >
                <span className="text-xs leading-none">{emoji}</span>
                <motion.span
                  key={`${emoji}-${count}`}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.15 }}
                  className="text-[10px] font-black tracking-wider leading-none"
                >
                  {count}
                </motion.span>
              </button>
            );
          })}
        </div>

        {/* Comments right side */}
        <div
          onClick={() => onCommentsClick(post)}
          className="ml-auto flex items-center gap-1.5 cursor-pointer group"
        >
          <MessageSquare size={13} className="text-zinc-600 group-hover:text-white transition" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 group-hover:text-white transition">
            {commentCount} COMMENTS
          </span>
          {commentCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
