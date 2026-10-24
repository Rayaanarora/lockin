"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { fieldClass } from "./ui/input";
import { POINTS_NAME } from "../lib/brand";

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  api: (path: string, options?: RequestInit) => Promise<any>;
  onViewProfile: (userId: number) => void;
}

export default function UserSearchModal({
  isOpen,
  onClose,
  currentUserId,
  api,
  onViewProfile,
}: UserSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const data = await api(`/users/search?q=${encodeURIComponent(query)}&currentUserId=${currentUserId}`);
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, currentUserId, api]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:top-[12vh] sm:translate-y-0 sm:data-[starting-style]:translate-y-[-12px] sm:data-[ending-style]:translate-y-0">
        <DialogHeader>
          <DialogTitle>Find people</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or department"
            aria-label="Search people"
            className={`${fieldClass} h-12 pl-11 pr-11`}
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 animate-spin text-ink-3" />}
        </div>

        <div className="max-h-[56vh] min-h-[160px] overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="py-10 text-center text-subhead text-ink-3">Type at least two letters.</p>
          ) : !loading && results.length === 0 ? (
            <p className="py-10 text-center text-subhead text-ink-3">Nobody matches &ldquo;{query.trim()}&rdquo;.</p>
          ) : (
            <ul className="space-y-1">
              <AnimatePresence initial={false}>
                {results.map((r, i) => {
                  const initials = r.name ? r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "??";
                  return (
                    <motion.li
                      key={r.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onViewProfile(r.id);
                          onClose();
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-line hover:bg-raised"
                      >
                        {r.avatar_url ? (
                          <img src={r.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full border border-line object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-raised font-display text-title-3 font-bold text-ink">{initials}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-subhead font-medium text-ink">{r.name}</span>
                          <span className="block truncate text-footnote text-ink-3">
                            {r.department}
                            {r.college ? ` · ${r.college}` : ""}
                          </span>
                        </span>
                        <span className="tabular shrink-0 text-subhead font-semibold text-ink">
                          {r.reputationScore ?? 0}
                          <span className="ml-1 text-caption font-normal text-gold">{POINTS_NAME}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
