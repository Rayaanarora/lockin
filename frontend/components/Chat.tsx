"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronLeft, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/motion";
import { spring } from "../lib/motion";
import { User, Mission, Message } from "../app/types";

interface ChatProps {
  mission: Mission;
  user: User;
  onClose: () => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
  socketUrl: string;
}

export default function Chat({ mission, user, onClose, api, socketUrl }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const list = await api(`/messages/${mission.id}?userId=${user.id}`);
      setMessages(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    load();
  }, [mission.id, user.id]);

  // Supabase Realtime Chat subscription
  useEffect(() => {
    if (!supabase) return;

    // Private channel: only the mission's members can receive (supabase/security.sql).
    const channel = supabase.channel(`mission_chat:${mission.id}`, { config: { private: true } });

    channel.on(
      "broadcast",
      { event: "new_message" },
      ({ payload }: { payload: Message }) => {
        if (payload.mission_id === mission.id) {
          setMessages((current) => {
            if (current.some((msg) => msg.id === payload.id)) return current;
            return [...current, payload];
          });
        }
      }
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [mission.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;

    const currentText = text.trim();
    setText("");

    try {
      const message = await api(`/messages/${mission.id}`, {
        method: "POST",
        body: JSON.stringify({ senderId: user.id, message: currentText })
      });
      setMessages((current) => {
        if (current.some((msg) => msg.id === message.id)) return current;
        return [...current, message];
      });
    } catch (err) {
      console.error("Message send failed", err);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[995] flex flex-col bg-bg"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%", transition: { duration: 0.25, ease: [0.65, 0, 0.35, 1] } }}
      transition={spring.glide}
      role="dialog"
      aria-modal="true"
      aria-label={`Chat: ${mission.title}`}
    >
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col">
        <header className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            aria-label="Back"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-2 transition-colors hover:text-ink"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <div className="min-w-0 flex-1">
            <h2 className="t-display truncate text-title-2 text-ink">{mission.title}</h2>
            <p className="flex items-center gap-1.5 text-footnote text-ink-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Live · mission chat
            </p>
          </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="ml-auto h-12 w-1/2" />
              <Skeleton className="h-12 w-3/5" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="t-display text-title-2 text-ink">Sort out the details</p>
              <p className="mt-1.5 max-w-[260px] text-subhead text-ink-2">Where exactly, who&apos;s bringing what. Keep it short. Text only.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m, i) => {
                const self = m.sender_id === user.id;
                const prev = messages[i - 1];
                const grouped = prev && prev.sender_id === m.sender_id;
                return (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, y: 12, scale: 0.96, x: self ? 12 : -12 }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                    transition={spring.glide}
                    style={{ originX: self ? 1 : 0 }}
                    className={`flex max-w-[82%] flex-col ${self ? "ml-auto items-end" : "mr-auto items-start"} ${grouped ? "-mt-2" : ""}`}
                  >
                    {!grouped && !self && <span className="mb-1 px-1 text-caption font-medium text-ink-3">{m.sender_name}</span>}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-subhead leading-relaxed ${
                        self ? "rounded-br-sm bg-ink text-bg" : "rounded-bl-md border border-line bg-surface text-ink"
                      }`}
                    >
                      {m.message}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>

        <form onSubmit={send} className="safe-bottom flex gap-2 border-t border-line px-4 pt-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" aria-label="Message" required autoComplete="off" />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.88 }}
            animate={text.trim() ? { scale: 1, opacity: 1 } : { scale: 0.92, opacity: 0.5 }}
            transition={spring.snap}
            aria-label="Send"
            className="flex h-12 w-12 shrink-0 items-center justify-center btn-primary"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
