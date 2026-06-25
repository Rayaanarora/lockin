"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Globe, Users, School, Loader2, Check } from "lucide-react";
import { uploadImage } from "../lib/supabase";

interface ShareToFeedSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recapId?: number;
  recapData?: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function ShareToFeedSheet({ isOpen, onClose, recapId, recapData }: ShareToFeedSheetProps) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"college" | "followers" | "everyone">("everyone");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setError("Only image files are allowed.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const userId = localStorage.getItem("lockin_user_id");
    if (!userId) {
      setError("User session not found.");
      setSubmitting(false);
      return;
    }

    try {
      let uploadedUrl: string | null = null;
      
      // 1. Upload image to storage / convert to base64 if selected
      if (imageFile) {
        uploadedUrl = await uploadImage(imageFile);
      } else if (recapData?.metadata?.screenshot) {
        // Carry over screenshot from recap card if present
        uploadedUrl = recapData.metadata.screenshot;
      }

      // 2. Submit post to backend
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number(userId),
          recapId: recapId ? Number(recapId) : null,
          imageUrl: uploadedUrl,
          caption: caption.trim() || null,
          visibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to share post.");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCaption("");
        setImageFile(null);
        setImagePreview(null);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/75 backdrop-blur-sm"
      >
        {/* Backdrop Closer */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Sliding Panel */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative z-10 w-full max-w-[430px] rounded-t-[32px] border-t border-white/[0.08] bg-[#0c0a09] px-6 pb-10 pt-5 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
        >
          {/* Handlebar */}
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-zinc-700" />

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-black tracking-wide uppercase">Post to Campus Feed</h3>
            <button
              onClick={onClose}
              className="rounded-full border border-white/5 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check size={28} />
              </div>
              <h4 className="text-base font-black uppercase tracking-wider text-emerald-400">Successfully Shared</h4>
              <p className="text-xs text-zinc-500 font-semibold mt-1">Your session is live on the campus feed.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Session Snapshot Mini Card */}
              {recapData && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-cherryRed">
                    Attaching Focus Card
                  </span>
                  <div className="mt-1 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black uppercase truncate text-white max-w-[200px]">
                        {recapData.missionTitle || recapData.missionName || "Focus Session"}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
                        {recapData.sessionDuration || 25} minutes • {recapData.categorySnapshot || "Other"}
                      </p>
                    </div>
                    <span className="text-xs font-black text-white/90">
                      Rank #{recapData.missionRank || recapData.rank || 1}
                    </span>
                  </div>
                </div>
              )}

              {/* Caption Entry */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Caption</label>
                <div className="relative">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                    placeholder="Write a reflection or share your progress..."
                    rows={3}
                    className="w-full rounded-xl border border-white/[0.06] bg-black/40 px-3.5 py-3 text-xs font-semibold text-cotton placeholder-zinc-600 focus:border-cherryRed focus:outline-none resize-none transition-colors"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[9px] font-black tracking-wider text-zinc-600">
                    {caption.length}/300
                  </span>
                </div>
              </div>

              {/* Image Drag and Drop */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Progress Image (Optional)</label>
                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 aspect-video w-full">
                    <img src={imagePreview} alt="Upload preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2.5 right-2.5 rounded-full bg-black/80 border border-white/10 p-1.5 text-zinc-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center cursor-pointer transition-all duration-200
                      ${dragActive
                        ? "border-cherryRed bg-cherryRed/5"
                        : "border-white/[0.08] bg-black/20 hover:border-white/20 hover:bg-black/35"
                      }
                    `}
                  >
                    <ImageIcon className="mb-2.5 h-6 w-6 text-zinc-500" />
                    <p className="text-[11px] font-bold text-zinc-400">
                      Drag & drop an image or <span className="text-cherryRed">browse files</span>
                    </p>
                    <p className="text-[9px] text-zinc-600 font-semibold mt-1">PNG, JPG up to 10MB</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Visibility Options */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Audience Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "everyone", label: "Everyone", icon: Globe },
                    { key: "followers", label: "Following", icon: Users },
                    { key: "college", label: "Campus Only", icon: School },
                  ].map((option) => {
                    const isSelected = visibility === option.key;
                    const Icon = option.icon;
                    return (
                      <button
                        type="button"
                        key={option.key}
                        onClick={() => setVisibility(option.key as any)}
                        className={`flex flex-col items-center justify-center rounded-xl border py-2.5 gap-1.5 transition-all outline-none
                          ${isSelected
                            ? "border-cherryRed bg-cherryRed/10 text-white"
                            : "border-white/[0.06] bg-black/40 text-zinc-500 hover:text-zinc-300 hover:border-white/10"
                          }
                        `}
                      >
                        <Icon size={14} className={isSelected ? "text-cherryRed" : ""} />
                        <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-[10px] font-bold text-cherryRed bg-cherryRed/5 border border-cherryRed/10 rounded-lg p-2.5 text-left leading-normal">
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-cherryRed py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Share Now"
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
