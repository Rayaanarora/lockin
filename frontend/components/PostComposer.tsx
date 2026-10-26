"use client";

import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { uploadImage } from "../lib/supabase";
import { Post, User } from "../app/types";

type Api = (path: string, options?: RequestInit) => Promise<any>;
type Visibility = Post["visibility"];

const MAX_PHOTOS = 4;
const MAX_CAPTION = 300; // matches createPost on the server
const AUDIENCE: { key: Visibility; label: string; hint: string }[] = [
  { key: "college", label: "Campus", hint: "Everyone at your college" },
  { key: "followers", label: "Followers", hint: "Only people who follow you" },
  { key: "everyone", label: "Everyone", hint: "Anyone on LOCKIN" }
];

/** Share a photo or a line about what you got done. Posts land at the top of the feed. */
export default function PostComposer({
  open,
  onOpenChange,
  user,
  api,
  onPosted
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User;
  api: Api;
  onPosted: (post: Post) => void;
}) {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("college");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setError("");
  }, [open]);

  // Free previews on unmount; removed photos are freed as they go.
  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_PHOTOS - files.length;
    const picked = Array.from(list)
      .filter((f) => /^image\/(jpeg|png|webp|gif)$/.test(f.type))
      .slice(0, room)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (list.length > room) setError(`Up to ${MAX_PHOTOS} photos per post.`);
    setFiles((cur) => [...cur, ...picked]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!caption.trim() && files.length === 0) {
      setError("Write something or add a photo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const imageUrls = await Promise.all(files.map((f) => uploadImage(f.file)));
      const post = await api("/posts", {
        method: "POST",
        body: JSON.stringify({ caption: caption.trim(), imageUrls, visibility })
      });
      onPosted(post);
      setCaption("");
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Couldn't post. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const left = MAX_CAPTION - caption.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg" initialFocus={textRef}>
        <DialogHeader>
          <DialogTitle className="t-display text-title-1 text-ink">New post</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="flex gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full border border-line object-cover" />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-footnote font-medium text-ink-2">
                {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <label htmlFor="post-caption" className="sr-only">
                Caption
              </label>
              <textarea
                id="post-caption"
                ref={textRef}
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
                rows={4}
                placeholder="What did you get done?"
                className="w-full resize-none bg-transparent pt-2 text-body leading-relaxed text-ink outline-none placeholder:text-ink-3"
              />
              <p className={`text-right text-caption tabular ${left < 20 ? "text-crimson" : "text-ink-3"}`}>{left}</p>
            </div>
          </div>

          {files.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {files.map((f, i) => (
                <li key={f.url} className="relative aspect-square overflow-hidden rounded-[4px] border border-line">
                  <img src={f.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(f.url);
                      setFiles((cur) => cur.filter((x) => x.url !== f.url));
                    }}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-3 border-y border-line py-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={files.length >= MAX_PHOTOS}
              className="flex h-11 items-center gap-2 px-1 text-subhead text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
            >
              <ImagePlus className="h-5 w-5" strokeWidth={1.6} /> Photo{files.length ? ` (${files.length}/${MAX_PHOTOS})` : ""}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <label className="flex items-center gap-2 text-subhead text-ink-2">
              <span className="sr-only">Who can see this</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="h-11 rounded-sm border border-line bg-surface px-3 text-subhead text-ink outline-none focus:border-ink/40"
              >
                {AUDIENCE.map((a) => (
                  <option key={a.key} value={a.key} className="bg-surface">
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="-mt-3 text-footnote text-ink-3">{AUDIENCE.find((a) => a.key === visibility)?.hint}</p>

          {error && (
            <p role="alert" className="text-subhead text-crimson">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || (!caption.trim() && files.length === 0)} className="btn-primary h-12 w-full disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? (files.length ? "Uploading" : "Posting") : "Post"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
