"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, MapPin, Check, X, MessageSquare, ShieldAlert, AlertCircle, Sparkles } from "lucide-react";
import { User, Mission } from "../app/types";
import Chat from "./Chat";

interface ActiveMissionsProps {
  user: User;
  refreshUser: () => Promise<void>;
  api: (path: string, options?: RequestInit) => Promise<any>;
  socketUrl: string;
}

export default function ActiveMissions({ user, refreshUser, api, socketUrl }: ActiveMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chatMission, setChatMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputCodes, setInputCodes] = useState<{ [missionId: number]: string }>({});
  const [errors, setErrors] = useState<{ [missionId: number]: string }>({});
  const [submitting, setSubmitting] = useState<{ [missionId: number]: boolean }>({});

  async function load() {
    try {
      const active = await api(`/missions/active/${user.id}`);
      setMissions(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      load();
    }, 15000); // refresh every 15s for faster request/check-in updates
    return () => clearInterval(interval);
  }, [user.id]);

  async function handleApprove(missionId: number, participantId: number) {
    try {
      await api(`/missions/${missionId}/approve-participant`, {
        method: "POST",
        body: JSON.stringify({ creatorId: user.id, participantId })
      });
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to approve request.");
    }
  }

  async function handleAttendance(missionId: number, showedUp: boolean, targetParticipantId?: number) {
    const code = inputCodes[missionId] || "";
    const pId = targetParticipantId || user.id; // if creator calls, it passes the participant's ID

    setErrors((prev) => ({ ...prev, [missionId]: "" }));
    setSubmitting((prev) => ({ ...prev, [missionId]: true }));

    try {
      await api(`/missions/${missionId}/attendance`, {
        method: "POST",
        body: JSON.stringify({ userId: pId, showedUp, code })
      });
      await Promise.all([load(), refreshUser()]);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [missionId]: err.message || "Failed to submit." }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [missionId]: false }));
    }
  }

  const isDue = (datetime: string) => {
    return new Date(datetime).getTime() <= Date.now();
  };

  const timeLeft = (datetime: string) => {
    const diff = new Date(datetime).getTime() - Date.now();
    if (diff <= 0) return "Ready";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  const pendingReviews = missions.filter(
    (mission) => mission.showed_up === null && isDue(mission.datetime) && mission.status === "Accepted"
  ).length;

  return (
    <section className="mx-auto w-full max-w-md flex-1 px-4 py-4 pb-24 space-y-6">
      {/* Title block */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-boxOrange">
            Execution Queue
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Runs</h2>
        </div>
        <div className="rounded-xl border border-white/5 bg-zinc-950/45 px-3 py-1.5 text-right">
          <span className="block text-[8px] font-black uppercase tracking-wider text-zinc-500">
            Completed
          </span>
          <span className="text-sm font-black text-boxGreen">
            {missions.filter((m) => m.status === "Completed").length}
          </span>
        </div>
      </div>

      {/* Pending join requests banner for creators */}
      {(() => {
        const pendingRequests = missions.filter(
          (m) => m.role === "creator" && m.status === "Requested"
        ).length;
        return pendingRequests > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-boxRed/35 bg-boxRed/5 p-3.5"
          >
            <AlertCircle className="h-4 w-4 text-boxRed shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">
                {pendingRequests} Join Request{pendingRequests > 1 ? "s" : ""} Waiting
              </h4>
              <p className="mt-1 text-[11px] font-medium leading-normal text-zinc-400">
                Review and approve who locks in with you. Scroll down to see them.
              </p>
            </div>
          </motion.div>
        ) : null;
      })()}

      {/* Attendance check alert */}
      {pendingReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-boxOrange/35 bg-boxOrange/5 p-3.5"
        >
          <ShieldAlert className="h-4 w-4 text-boxOrange shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">
              Attendance check required
            </h4>
            <p className="mt-1 text-[11px] font-medium leading-normal text-zinc-400">
              Confirm who showed up on {pendingReviews} due runway{pendingReviews > 1 ? "s" : ""} to sync Aura.
            </p>
          </div>
        </motion.div>
      )}

      {/* Queue items */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-xs font-bold text-zinc-600 uppercase tracking-widest">
            Syncing queue...
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-zinc-950/10 p-6">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Queue Empty</p>
            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed max-w-[200px] mx-auto">
              Accept targets from the discovery board or launch a new runway.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((mission, idx) => {
              const due = isDue(mission.datetime);
              const isCreator = mission.role === "creator";
              const isRequest = mission.status === "Requested";
              const active = mission.status === "Accepted";
              const needsReview = mission.showed_up === null && due && active;
              
              let statusLabel = mission.status || "Pending";
              let statusColor = "border-white/10 bg-zinc-950/30 text-zinc-400";

              if (isRequest) {
                statusLabel = "Request";
                statusColor = "border-boxOrange/25 bg-boxOrange/10 text-boxOrange animate-pulse";
              } else if (active) {
                statusLabel = "Active";
                statusColor = "border-boxOrange/45 bg-boxOrange/5 text-boxOrange";
              } else if (mission.status === "Completed") {
                statusLabel = "Completed";
                statusColor = "border-boxGreen/25 bg-boxGreen/10 text-boxGreen shadow-[0_0_15px_rgba(24,189,0,0.06)]";
              } else if (mission.status === "Missed") {
                statusLabel = "Missed";
                statusColor = "border-boxRed/25 bg-boxRed/10 text-boxRed";
              }

              return (
                <motion.article
                  key={`${mission.id}-${mission.role}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl border bg-zinc-950/50 p-4 shadow-sm backdrop-blur-md transition ${
                    needsReview ? "border-boxOrange/40 ring-1 ring-boxOrange/10" : "border-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3 text-left">
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">
                        {mission.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        {isCreator 
                          ? `Host (Participant: ${mission.participant_name})`
                          : `Partner: ${mission.creator_name}`
                        }
                      </p>
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Timing & Location */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs font-bold text-zinc-400 mb-4 text-left">
                    <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/30 p-2.5">
                      <CalendarClock className="h-3.5 w-3.5 text-boxOrange shrink-0" />
                      <span>{due ? "Ready" : timeLeft(mission.datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/30 p-2.5">
                      <MapPin className="h-3.5 w-3.5 text-boxRed shrink-0" />
                      <span className="truncate">{mission.location}</span>
                    </div>
                  </div>

                  {/* 1. Request Review Box (Creator Only) */}
                  {isCreator && isRequest && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-3 rounded-xl border border-boxOrange/20 bg-boxOrange/5 p-3 text-left space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-white">
                            Join Request Received
                          </p>
                          <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">
                            Dept: {mission.participant_department}
                          </p>
                        </div>
                        <div className="rounded-lg border border-boxGreen/20 bg-boxGreen/5 px-2 py-0.5 text-[9px] font-black text-boxGreen flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> {mission.participant_reputation} Aura
                        </div>
                      </div>
                      
                      <button
                        onClick={() => mission.participant_id && handleApprove(mission.id, mission.participant_id)}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-boxOrange text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-boxOrange/95"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" /> Approve Request
                      </button>
                    </motion.div>
                  )}

                  {/* 2. Participant Request Pending state */}
                  {!isCreator && isRequest && (
                    <div className="mb-3 rounded-xl border border-white/5 bg-zinc-900/20 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Join Requested
                      </p>
                      <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">
                        Waiting for {mission.creator_name} to approve your lock-in request...
                      </p>
                    </div>
                  )}

                  {/* 3. Confirmed Active Review / OTP Code check */}
                  {active && (
                    <div className="space-y-3">
                      {/* Creator Code display */}
                      {isCreator && due && (
                        <div className="rounded-xl border border-boxGreen/20 bg-boxGreen/5 p-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-wider text-white">
                            Meetup Verification Code
                          </p>
                          <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">
                            Share this OTP with {mission.participant_name} to check in:
                          </p>
                          <div className="mt-2 text-2xl font-black tracking-widest text-boxGreen bg-black/40 rounded-lg py-1 max-w-[120px] mx-auto border border-boxGreen/20 shadow-[0_0_15px_rgba(24,189,0,0.1)]">
                            {mission.verification_code}
                          </div>
                        </div>
                      )}

                      {/* Participant OTP Entry box */}
                      {!isCreator && due && (
                        <div className="rounded-xl border border-boxOrange/20 bg-boxOrange/5 p-3 text-left space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-white">
                            Enter Verification OTP
                          </p>
                          <p className="text-[9px] text-zinc-500 font-semibold">
                            Get the 4-digit code from {mission.creator_name} to complete runway.
                          </p>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="0000"
                              value={inputCodes[mission.id] || ""}
                              onChange={(e) => setInputCodes({ ...inputCodes, [mission.id]: e.target.value.replace(/\D/g, "") })}
                              className="h-9 w-24 rounded-lg border border-white/10 bg-black/40 text-center text-sm font-black tracking-widest text-white outline-none focus:border-boxOrange"
                            />
                            <button
                              onClick={() => handleAttendance(mission.id, true)}
                              disabled={submitting[mission.id]}
                              className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-boxGreen text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-boxGreen/95 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" /> Verify & Check In
                            </button>
                          </div>
                        </div>
                      )}

                      {errors[mission.id] && (
                        <p className="text-[10px] font-bold text-boxRed text-center animate-pulse">
                          {errors[mission.id]}
                        </p>
                      )}

                      {/* Creator control: can mark participant as missed */}
                      {isCreator && due && (
                        <button
                          onClick={() => handleAttendance(mission.id, false, mission.participant_id)}
                          disabled={submitting[mission.id]}
                          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-boxRed/30 bg-boxRed/5 text-[10px] font-black uppercase tracking-wider text-boxRed hover:bg-boxRed/10 transition disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5 stroke-[3]" /> Participant No-Show
                        </button>
                      )}

                      {/* Participant self-report missed */}
                      {!isCreator && due && (
                        <button
                          onClick={() => handleAttendance(mission.id, false)}
                          disabled={submitting[mission.id]}
                          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-zinc-900/10 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-400 hover:bg-white/5 transition disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5 stroke-[2]" /> I missed this meetup
                        </button>
                      )}
                    </div>
                  )}

                  {/* Confirmed / Past Runway Footer: Chat Access */}
                  {!isRequest && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setChatMission(mission)}
                        className="flex-1 flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition"
                      >
                        <MessageSquare className="h-4 w-4 text-boxOrange" />
                        <span>Rendezvous Chat</span>
                      </button>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Chat Panel when selected */}
      <AnimatePresence>
        {chatMission && (
          <Chat
            mission={chatMission}
            user={user}
            onClose={() => setChatMission(null)}
            api={api}
            socketUrl={socketUrl}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
