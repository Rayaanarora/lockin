"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Reveal, Skeleton } from "./ui/motion";
import { spring } from "../lib/motion";
import { POINTS_NAME } from "../lib/brand";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  initialTab: "followers" | "following";
  onViewProfile: (userId: number) => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

export default function FollowListModal({ isOpen, onClose, userId, initialTab, onViewProfile, api }: FollowListModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;
    setLoading(true);
    setUsers([]);
    api(`/follow/${userId}/${activeTab}`)
      .then((data) => !cancelled && setUsers(data || []))
      .catch((err) => {
        console.error(`Failed to load ${activeTab}:`, err);
        if (!cancelled) setUsers([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, activeTab, isOpen, api]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>

        <div className="flex rounded-xl border border-line bg-raised p-1" role="tablist">
          {(["followers", "following"] as const).map((t) => {
            const on = activeTab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveTab(t)}
                className={`relative h-10 flex-1 rounded-sm text-[11px] font-medium uppercase tracking-[0.2em] transition-colors ${on ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
              >
                {on && <motion.span layoutId="follow-tab" className="absolute inset-0 rounded-lg bg-overlay shadow-[inset_0_-2px_0_rgb(var(--signal))]" transition={spring.glide} />}
                <span className="relative">{t}</span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[52vh] min-h-[200px] overflow-y-auto">
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="h-8 w-8 text-ink-3" />
              <p className="mt-3 text-subhead text-ink-2">{activeTab === "followers" ? "No followers yet." : "Not following anyone yet."}</p>
            </div>
          ) : (
            <Reveal key={activeTab} className="space-y-1.5" each={0.03}>
              {users.map((row) => {
                const initials = row.name ? row.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
                return (
                  <Reveal.Item key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onViewProfile(row.id);
                        onClose();
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-line hover:bg-raised"
                    >
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full border border-line object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-raised font-display text-title-3 font-bold text-ink">{initials}</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-subhead font-medium text-ink">{row.name}</span>
                        <span className="block truncate text-footnote text-ink-3">
                          {row.department}
                          {row.college ? ` · ${row.college}` : ""}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-subhead font-semibold text-ink">
                        {row.reputationScore ?? 0}
                        <span className="ml-1 text-caption font-normal text-gold">{POINTS_NAME}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </Reveal.Item>
                );
              })}
            </Reveal>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
