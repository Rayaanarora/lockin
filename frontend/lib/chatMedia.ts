"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

/*
 * Chat attachments. Files go to the private "chat" bucket under the sender's
 * auth id (the storage policy allows nothing else); messages carry only the
 * path, and the server signs short-lived URLs for readers.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;
export const MAX_VOICE_SECONDS = 120;

export interface MediaRef {
  media_path: string;
  media_meta: Record<string, unknown>;
}

async function authFolder(): Promise<string> {
  if (!supabase) throw new Error("Attachments aren't available right now.");
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("Sign in again to send attachments.");
  return uid;
}

async function upload(blob: Blob, ext: string, contentType: string): Promise<string> {
  if (blob.size > MAX_BYTES) throw new Error("That file is over 10 MB.");
  const folder = await authFolder();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase!.storage.from("chat").upload(path, blob, { contentType, upsert: false });
  if (error) throw new Error("Upload failed. Check your connection and try again.");
  return path;
}

/** Downscale big photos (keeps GIFs as they are). Returns the blob and its size. */
export async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Send a JPG, PNG, WebP or GIF.");
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  if (file.type === "image/gif" || Math.max(width, height) <= MAX_IMAGE_EDGE) {
    bitmap.close();
    return { blob: file, width, height, type: file.type };
  }
  const scale = MAX_IMAGE_EDGE / Math.max(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that photo."))), "image/jpeg", 0.86)
  );
  return { blob, width: w, height: h, type: "image/jpeg" };
}

export async function uploadImage(img: { blob: Blob; width: number; height: number; type: string }): Promise<MediaRef> {
  const ext = img.type === "image/png" ? "png" : img.type === "image/webp" ? "webp" : img.type === "image/gif" ? "gif" : "jpg";
  const media_path = await upload(img.blob, ext, img.type);
  return { media_path, media_meta: { width: img.width, height: img.height } };
}

export interface VoiceClip {
  blob: Blob;
  mime: string;
  duration: number;
  peaks: number[];
}

export async function uploadVoice(clip: VoiceClip): Promise<MediaRef> {
  const base = clip.mime.split(";")[0];
  const ext = base === "audio/mp4" ? "m4a" : base === "audio/ogg" ? "ogg" : base === "audio/mpeg" ? "mp3" : "webm";
  const contentType = ext === "m4a" ? "audio/mp4" : base;
  const media_path = await upload(clip.blob, ext, contentType);
  return { media_path, media_meta: { duration: clip.duration, peaks: clip.peaks } };
}

/** Squash a long level history into `n` bars (max of each bucket), 0..1. */
export function toPeaks(levels: number[], n = 40): number[] {
  if (!levels.length) return Array(n).fill(0.08);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const from = Math.floor((i * levels.length) / n);
    const to = Math.max(from + 1, Math.floor(((i + 1) * levels.length) / n));
    out.push(Math.max(...levels.slice(from, to)));
  }
  const top = Math.max(...out, 0.01);
  return out.map((v) => Math.max(0.08, Math.min(1, v / top)));
}

function pickMime() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) || "";
}

export type RecorderState = "idle" | "recording" | "denied" | "unsupported";

/** Tap-to-record voice messages with a live waveform. */
export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const rec = useRef<{
    recorder: MediaRecorder;
    stream: MediaStream;
    ctx: AudioContext;
    chunks: Blob[];
    levels: number[];
    started: number;
    timer: ReturnType<typeof setInterval>;
    mime: string;
    resolve?: (clip: VoiceClip | null) => void;
    cancelled: boolean;
  } | null>(null);

  const teardown = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    clearInterval(r.timer);
    r.stream.getTracks().forEach((t) => t.stop());
    r.ctx.close().catch(() => {});
    rec.current = null;
    setState("idle");
    setElapsed(0);
    setLevels([]);
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("unsupported");
      return false;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setState("denied");
      return false;
    }
    const mime = pickMime();
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);

    const r = {
      recorder,
      stream,
      ctx,
      chunks: [] as Blob[],
      levels: [] as number[],
      started: Date.now(),
      timer: 0 as unknown as ReturnType<typeof setInterval>,
      mime: recorder.mimeType || mime || "audio/webm",
      cancelled: false
    } as NonNullable<typeof rec.current>;
    rec.current = r;

    recorder.ondataavailable = (e) => e.data.size && r.chunks.push(e.data);
    recorder.onstop = () => {
      const duration = Math.min(MAX_VOICE_SECONDS, (Date.now() - r.started) / 1000);
      const clip = r.cancelled || duration < 0.6
        ? null
        : { blob: new Blob(r.chunks, { type: r.mime }), mime: r.mime, duration: Math.round(duration * 10) / 10, peaks: toPeaks(r.levels) };
      const done = r.resolve;
      teardown();
      done?.(clip);
    };

    r.timer = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.min(1, Math.sqrt(sum / buf.length) * 3);
      r.levels.push(rms);
      setLevels((l) => [...l.slice(-47), rms]);
      const secs = (Date.now() - r.started) / 1000;
      setElapsed(secs);
      if (secs >= MAX_VOICE_SECONDS && recorder.state === "recording") recorder.stop();
    }, 100);

    recorder.start(250);
    setState("recording");
    return true;
  }, [teardown]);

  /** Stop and get the clip (null if cancelled or too short). */
  const stop = useCallback(
    () =>
      new Promise<VoiceClip | null>((resolve) => {
        const r = rec.current;
        if (!r) return resolve(null);
        r.resolve = resolve;
        if (r.recorder.state !== "inactive") r.recorder.stop();
      }),
    []
  );

  const cancel = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    r.cancelled = true;
    if (r.recorder.state !== "inactive") r.recorder.stop();
    else teardown();
  }, [teardown]);

  const reset = useCallback(() => setState("idle"), []);

  return { state, elapsed, levels, start, stop, cancel, reset };
}

export const fmtSeconds = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
