"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mission } from "../app/types";
import { MissionChatPane } from "./inbox/panes";
import { ease } from "../lib/motion";

interface ChatProps {
  mission: Mission;
  user: User;
  onClose: () => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
  socketUrl?: string;
}

/** Mission chat opened from a Queue card: the same thread as the Inbox, full screen. */
export default function Chat({ mission, user, onClose, api }: ChatProps) {
  const crew = mission.attendees?.length || mission.locked_in_count || 0;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      className="fixed inset-0 z-[995] flex flex-col bg-bg"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%", transition: { duration: 0.22, ease: ease.inOut } }}
      transition={{ duration: 0.34, ease: ease.out }}
      role="dialog"
      aria-modal="true"
      aria-label={`Chat: ${mission.title}`}
    >
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col md:border-x md:border-line">
        <MissionChatPane
          missionId={mission.id}
          title={mission.title}
          sub={crew ? `${crew} locked in · Mission chat` : "Mission chat"}
          user={user}
          api={api}
          onBack={onClose}
        />
      </div>
    </motion.div>
  );
}
