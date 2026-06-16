"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, MapPin, Check, X, MessageSquare, ShieldAlert, AlertCircle, Sparkles, Trophy } from "lucide-react";
import { User, Mission } from "../app/types";
import Chat from "./Chat";
import RecapCard from "./RecapCard";

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
  const [tasksCompletedInput, setTasksCompletedInput] = useState<{ [missionId: number]: string }>({});
  const [recapData, setRecapData] = useState<any | null>(null);
  const [showRecapCard, setShowRecapCard] = useState(false);

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

  async function handleFinishSession(missionId: number, tasksCompleted: number) {
    try {
      const result = await api(`/missions/${missionId}/finish`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id, tasksCompleted })
      });
      setRecapData(result);
      setShowRecapCard(true);
      await Promise.all([load(), refreshUser()]);
    } catch (err: any) {
      alert(err.message || "Failed to finish focus session.");
    }
  }

  async function handleViewMissionRecap(missionId: number) {
    try {
      const result = await api(`/recaps/mission/${missionId}/user/${user.id}`);
      setRecapData(result);
      setShowRecapCard(true);
    } catch (err: any) {
      alert("No recap data saved for this past mission.");
    }
  }

  async function handleVibeCheck(missionId: number, rating: "W" | "L") {
    try {
      await api(`/missions/${missionId}/vibe-check`, {
        method: "POST",
        body: JSON.stringify({ raterId: user.id, rating })
      });
      await Promise.all([load(), refreshUser()]);
      alert("Vibe check submitted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to submit vibe check.");
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
    <section className="mx-auto w-full max-w-md md:max-w-5xl flex-1 px-4 py-4 pb-24 md:pb-6 space-y-6">
      {/* Title block */}
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-boxOrange">
            Execution Queue
          </span>
          <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight mt-1">Active Runs</h2>
        </div>
        <div className="rounded-xl md:rounded-2xl border border-white/5 bg-zinc-950/45 px-3 md:px-5 py-1.5 md:py-2.5 text-right">
          <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-wider text-zinc-500">
            Completed
          </span>
          <span className="text-sm md:text-lg font-black text-boxRed">
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
            className="flex items-start gap-3 rounded-xl border border-boxRed/35 bg-boxRed/5 p-3.5 md:p-4.5"
          >
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-boxRed shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-wider leading-none">
                {pendingRequests} Join Request{pendingRequests > 1 ? "s" : ""} Waiting
              </h4>
              <p className="mt-1 text-[11px] md:text-xs font-medium leading-normal text-zinc-400">
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
          className="flex items-start gap-3 rounded-xl border border-boxOrange/35 bg-boxOrange/5 p-3.5 md:p-4.5"
        >
          <ShieldAlert className="h-4 w-4 md:h-5 md:w-5 text-boxOrange shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-wider leading-none">
              Attendance check required
            </h4>
            <p className="mt-1 text-[11px] md:text-xs font-medium leading-normal text-zinc-400">
              Confirm who showed up on {pendingReviews} due runway{pendingReviews > 1 ? "s" : ""} to sync Aura.
            </p>
          </div>
        </motion.div>
      )}

      {/* Queue items */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-xs md:text-sm font-bold text-zinc-600 uppercase tracking-widest">
            Syncing queue...
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-zinc-950/10 p-8">
            <p className="text-xs md:text-sm font-bold text-zinc-600 uppercase tracking-widest">Queue Empty</p>
            <p className="mt-2 text-xs md:text-sm text-zinc-500 leading-relaxed max-w-[240px] mx-auto">
              Accept targets from the discovery board or launch a new runway.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
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
                statusColor = "border-boxOrange/25 bg-boxOrange/10 text-boxOrange";
              } else if (active) {
                statusLabel = "Active";
                statusColor = "border-boxOrange/45 bg-boxOrange/5 text-boxOrange";
              } else if (mission.status === "Executing") {
                statusLabel = "LOCKED IN";
                statusColor = "border-boxOrange/40 bg-boxOrange/5 text-boxOrange";
              } else if (mission.status === "Completed") {
                statusLabel = "Completed";
                statusColor = "border-white/20 bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.04)]";
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
                  className={`rounded-2xl border bg-zinc-950/50 p-4 md:p-6 shadow-sm backdrop-blur-md transition ${
                    needsReview ? "border-boxOrange/40 ring-1 ring-boxOrange/10" : "border-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3.5 text-left">
                    <div>
                      <h3 className="text-sm md:text-base lg:text-lg font-black text-white leading-tight">
                        {mission.title}
                      </h3>
                      <p className="mt-1 text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {isCreator 
                          ? `Host (Participant: ${mission.participant_name})`
                          : `Partner: ${mission.creator_name}`
                        }
                      </p>
                    </div>
                    <span className={`rounded-md border px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-black uppercase tracking-wider shrink-0 h-fit ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Timing & Location */}
                  <div className="grid grid-cols-2 gap-3.5 text-xs md:text-sm font-bold text-zinc-400 mb-4.5 text-left">
                    <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-black/30 p-2.5 md:p-3.5">
                      <CalendarClock className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 text-boxOrange shrink-0" />
                      <span>{due ? "Ready" : timeLeft(mission.datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-black/30 p-2.5 md:p-3.5">
                      <MapPin className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 text-boxRed shrink-0" />
                      <span className="truncate">{mission.location}</span>
                    </div>
                  </div>

                  {/* 1. Request Review Box (Creator Only) */}
                  {isCreator && isRequest && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-3.5 rounded-xl border border-boxOrange/20 bg-boxOrange/5 p-3 md:p-4.5 text-left space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white">
                            Join Request Received
                          </p>
                          <p className="text-[9px] md:text-xs text-zinc-400 font-semibold mt-0.5">
                            Dept: {mission.participant_department}
                          </p>
                        </div>
                        <div className="rounded-lg border border-boxRed/20 bg-boxRed/5 px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-black text-boxRed flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> {mission.participant_reputation} Aura
                        </div>
                      </div>
                      
                      <button
                        onClick={() => mission.participant_id && handleApprove(mission.id, mission.participant_id)}
                        className="flex h-9 md:h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-boxOrange text-[10px] md:text-xs font-black uppercase tracking-wider text-white transition hover:bg-boxOrange/95"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" /> Approve Request
                      </button>
                    </motion.div>
                  )}

                  {/* 2. Participant Request Pending state */}
                  {!isCreator && isRequest && (
                    <div className="mb-3.5 rounded-xl border border-white/5 bg-zinc-900/20 p-3.5 md:p-4.5 text-center">
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-zinc-400">
                        Join Requested
                      </p>
                      <p className="text-[9px] md:text-xs text-zinc-500 font-semibold mt-0.5">
                        Waiting for {mission.creator_name} to approve your lock-in request...
                      </p>
                    </div>
                  )}

                  {/* 3. Confirmed Active Review / OTP Code check */}
                  {active && (
                    <div className="space-y-3">
                      {/* Creator Code display */}
                      {isCreator && due && (
                        <div className="rounded-xl border border-boxRed/20 bg-boxRed/5 p-3.5 md:p-4.5 text-center">
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white">
                            Meetup Verification Code
                          </p>
                          <p className="text-[9px] md:text-xs text-zinc-500 font-semibold mt-0.5">
                            Share this OTP with {mission.participant_name} to check in:
                          </p>
                          <div className="mt-2.5 text-2xl md:text-3xl font-black tracking-widest text-boxRed bg-black/40 rounded-lg py-1 md:py-2.5 max-w-[120px] md:max-w-[150px] mx-auto border border-boxRed/20 shadow-[0_0_15px_rgba(245,38,1,0.1)]">
                            {mission.verification_code}
                          </div>
                        </div>
                      )}

                      {/* Participant OTP Entry box */}
                      {!isCreator && due && (
                        <div className="rounded-xl border border-boxOrange/20 bg-boxOrange/5 p-3.5 md:p-4.5 text-left space-y-2.5">
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white">
                            Enter Verification OTP
                          </p>
                          <p className="text-[9px] md:text-xs text-zinc-500 font-semibold">
                            Get the 4-digit code from {mission.creator_name} to complete runway.
                          </p>
                          
                          <div className="flex gap-2.5">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="0000"
                              value={inputCodes[mission.id] || ""}
                              onChange={(e) => setInputCodes({ ...inputCodes, [mission.id]: e.target.value.replace(/\D/g, "") })}
                              className="h-9 md:h-11 w-24 md:w-32 rounded-lg border border-white/10 bg-black/40 text-center text-sm md:text-base font-black tracking-widest text-white outline-none focus:border-boxOrange"
                            />
                            <button
                              onClick={() => handleAttendance(mission.id, true)}
                              disabled={submitting[mission.id]}
                              className="flex-1 flex h-9 md:h-11 items-center justify-center gap-1.5 rounded-lg bg-boxRed text-[10px] md:text-xs font-black uppercase tracking-wider text-white transition hover:bg-boxRed/95 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" /> Verify & Check In
                            </button>
                          </div>
                        </div>
                      )}

                      {errors[mission.id] && (
                        <p className="text-[10px] md:text-xs font-bold text-boxRed text-center">
                          {errors[mission.id]}
                        </p>
                      )}

                      {/* Creator control: can mark participant as missed */}
                      {isCreator && due && (
                        <button
                          onClick={() => handleAttendance(mission.id, false, mission.participant_id)}
                          disabled={submitting[mission.id]}
                          className="flex h-9 md:h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-boxRed/30 bg-boxRed/5 text-[10px] md:text-xs font-black uppercase tracking-wider text-boxRed hover:bg-boxRed/10 transition disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5 stroke-[3]" /> Participant No-Show
                        </button>
                      )}

                      {/* Participant self-report missed */}
                      {!isCreator && due && (
                        <button
                          onClick={() => handleAttendance(mission.id, false)}
                          disabled={submitting[mission.id]}
                          className="flex h-9 md:h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-zinc-900/10 text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-400 hover:bg-white/5 transition disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5 stroke-[2]" /> I missed this meetup
                        </button>
                      )}
                    </div>
                  )}

                  {/* Executing Status Workspace */}
                  {mission.status === "Executing" && (
                    <div className="mt-3.5 space-y-3">
                      <div className="rounded-xl border border-boxOrange/25 bg-boxOrange/5 p-3 text-center">
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white">
                          LOCKED IN & EXECUTING
                        </p>
                        <p className="text-[9px] md:text-xs text-zinc-400 font-semibold mt-1">
                          You are currently focused on this mission. Complete your work below.
                        </p>
                      </div>

                      {/* Checkout / Finish form */}
                      <div className="rounded-xl border border-white/8 bg-black/40 p-4 space-y-3 text-left">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500">
                          Tasks Completed
                        </label>
                        <select
                          value={tasksCompletedInput[mission.id] || "0"}
                          onChange={(e) => setTasksCompletedInput({ ...tasksCompletedInput, [mission.id]: e.target.value })}
                          className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950 text-xs text-white outline-none focus:border-boxOrange px-2"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={String(n)}>{n} Tasks Completed</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleFinishSession(mission.id, Number(tasksCompletedInput[mission.id] || 0))}
                          className="w-full flex h-10 items-center justify-center gap-1.5 rounded-lg bg-boxOrange text-xs font-black uppercase tracking-wider text-white transition hover:bg-boxOrange/95"
                        >
                          Complete Focus Session
                        </button>
                      </div>

                      {/* Optional vibe check rating if they want extra aura */}
                      {(!!mission.participant_name || !!mission.creator_name) && (
                        <div className="rounded-xl border border-white/5 bg-zinc-900/10 p-3.5 space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 text-left">
                            Optional: Rate Partner's Vibe
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVibeCheck(mission.id, "W")}
                              className="flex-1 flex h-8 items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/5 text-[10px] font-bold text-white hover:bg-white/10 transition"
                            >
                              W Vibe (+2 Aura)
                            </button>
                            <button
                              onClick={() => handleVibeCheck(mission.id, "L")}
                              className="flex-1 flex h-8 items-center justify-center gap-1 rounded-lg border border-boxRed/20 bg-boxRed/5 text-[10px] font-bold text-boxRed hover:bg-boxRed/10 transition"
                            >
                              L Vibe (-1 Aura)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirmed / Past Runway Footer: Chat Access */}
                  {!isRequest && (
                    <div className="mt-3.5 flex gap-2">
                      <button
                        onClick={() => setChatMission(mission)}
                        className="flex-1 flex h-9 md:h-11 items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 text-xs md:text-sm font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition"
                      >
                        <MessageSquare className="h-4 w-4 md:h-4.5 md:w-4.5 text-boxOrange" />
                        <span>Rendezvous Chat</span>
                      </button>

                      {mission.status === "Completed" && (
                        <button
                          onClick={() => handleViewMissionRecap(mission.id)}
                          className="flex-1 flex h-9 md:h-11 items-center justify-center gap-2.5 rounded-xl border border-boxOrange/30 bg-boxOrange/5 text-xs md:text-sm font-bold text-boxOrange hover:bg-boxOrange/10 transition"
                        >
                          <Trophy className="h-4 w-4 text-boxOrange" />
                          <span>View Recap</span>
                        </button>
                      )}
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

      {/* Recap Card Modal */}
      {recapData && (
        <RecapCard
          isOpen={showRecapCard}
          onClose={() => setShowRecapCard(false)}
          recapData={recapData}
        />
      )}
    </section>
  );
}
