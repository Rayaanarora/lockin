"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, MapPin, Check, X, MessageSquare, ShieldAlert, AlertCircle, Sparkles, Trophy, Plus, Trash2, CheckSquare, Square, FileText } from "lucide-react";
import { User, Mission } from "../app/types";
import Chat from "./Chat";
import RecapCard from "./RecapCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

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

  // New V2 states
  const [missionTasks, setMissionTasks] = useState<{ [missionId: number]: any[] }>({});
  const [loadingTasks, setLoadingTasks] = useState<{ [missionId: number]: boolean }>({});
  const [newTaskTitles, setNewTaskTitles] = useState<{ [missionId: number]: string }>({});

  const [activeReflectionMission, setActiveReflectionMission] = useState<Mission | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [isPublicReflection, setIsPublicReflection] = useState(true);
  const [submittingReflection, setSubmittingReflection] = useState(false);

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

  async function loadTasks(missionId: number) {
    setLoadingTasks(prev => ({ ...prev, [missionId]: true }));
    try {
      const tasks = await api(`/tasks/mission/${missionId}`);
      setMissionTasks(prev => ({ ...prev, [missionId]: tasks }));
    } catch (err) {
      console.error("Error loading tasks", err);
    } finally {
      setLoadingTasks(prev => ({ ...prev, [missionId]: false }));
    }
  }

  async function handleToggleTask(missionId: number, taskId: number) {
    try {
      await api(`/tasks/${taskId}/toggle`, { method: "PUT" });
      await loadTasks(missionId);
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  }

  async function handleAddTask(missionId: number) {
    const title = newTaskTitles[missionId] || "";
    if (!title.trim()) return;
    try {
      const currentTasks = missionTasks[missionId] || [];
      const position = currentTasks.length;
      await api(`/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), missionId, position })
      });
      setNewTaskTitles(prev => ({ ...prev, [missionId]: "" }));
      await loadTasks(missionId);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  }

  async function handleDeleteTask(missionId: number, taskId: number) {
    try {
      await api(`/tasks/${taskId}`, { method: "DELETE" });
      await loadTasks(missionId);
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  }

  function initiateFinishSession(mission: Mission) {
    setActiveReflectionMission(mission);
    setReflectionText("");
    setLessonsLearned("");
    setIsPublicReflection(true);
  }

  async function submitFinishSession() {
    if (!activeReflectionMission) return;
    setSubmittingReflection(true);
    try {
      const missionId = activeReflectionMission.id;
      const tasksList = missionTasks[missionId] || [];
      const tasksCompleted = tasksList.filter(t => t.completed).length;

      const result = await api(`/missions/${missionId}/finish`, {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          tasksCompleted,
          reflection: {
            reflectionText: reflectionText.trim() || null,
            lessonsLearned: lessonsLearned.trim() || null,
            isPublic: isPublicReflection
          }
        })
      });

      setRecapData(result);
      setShowRecapCard(true);
      setActiveReflectionMission(null);
      await Promise.all([load(), refreshUser()]);
    } catch (err: any) {
      alert(err.message || "Failed to finish focus session.");
    } finally {
      setSubmittingReflection(false);
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

  useEffect(() => {
    missions.forEach(m => {
      if (m.status === "Executing" && !missionTasks[m.id]) {
        loadTasks(m.id);
      }
    });
  }, [missions]);

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
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-cherryRed">
            Execution Queue
          </span>
          <h2 className="text-xl md:text-3xl font-bold text-cotton tracking-tight mt-1">Active Runs</h2>
        </div>
        <div className="rounded-xl md:rounded-2xl border border-white/5 bg-zinc-950/45 px-3 md:px-5 py-1.5 md:py-2.5 text-right">
          <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-wider text-zinc-500">
            Completed
          </span>
          <span className="text-sm md:text-lg font-black text-luxuryGold">
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
            className="flex items-start gap-3 rounded-xl border border-cherryRed/35 bg-cherryRed/5 p-3.5 md:p-4.5"
          >
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-cherryRed shrink-0 mt-0.5 animate-pulse" />
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
          className="flex items-start gap-3 rounded-xl border border-luxuryGold/35 bg-luxuryGold/5 p-3.5 md:p-4.5"
        >
          <ShieldAlert className="h-4 w-4 md:h-5 md:w-5 text-luxuryGold shrink-0 mt-0.5 animate-pulse" />
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
              const isSolo = mission.mission_type === "solo";
              const due = isDue(mission.datetime) || isSolo;
              const isCreator = mission.role === "creator" || isSolo;
              const isRequest = mission.status === "Requested";
              const active = mission.status === "Accepted";
              const needsReview = mission.showed_up === null && due && active && !isSolo;
              
              let statusLabel = mission.status || "Pending";
              let statusColor = "border-luxuryMaroon/20 bg-noirBlack/40 text-cotton/60";

              if (isRequest) {
                statusLabel = "Request";
                statusColor = "border-luxuryGold/25 bg-luxuryGold/10 text-luxuryGold";
              } else if (active) {
                statusLabel = isSolo ? "Solo Active" : "Active";
                statusColor = "border-luxuryGold/45 bg-luxuryGold/5 text-luxuryGold";
              } else if (mission.status === "Executing") {
                statusLabel = "LOCKED IN";
                statusColor = "border-cherryRed/50 bg-[#810100] text-cotton shadow-[0_0_15px_rgba(129,1,0,0.15)]";
              } else if (mission.status === "Completed") {
                statusLabel = "Completed";
                statusColor = "border-luxuryGold/35 bg-luxuryGold/10 text-luxuryGold shadow-[0_0_15px_rgba(197,168,128,0.1)]";
              } else if (mission.status === "Missed") {
                statusLabel = "Missed";
                statusColor = "border-cherryRed/25 bg-cherryRed/10 text-cherryRed";
              }

              let roleLabel = "";
              if (isSolo) {
                roleLabel = "Solo Focus";
              } else if (isCreator) {
                roleLabel = `Host (Participant: ${mission.participant_name})`;
              } else {
                roleLabel = `Partner: ${mission.creator_name}`;
              }

              return (
                <motion.article
                  key={`${mission.id}-${mission.role}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl border bg-noirBlack/45 p-4 md:p-6 shadow-sm backdrop-blur-md transition hover:scale-[1.01] hover:border-white/10 ${
                    needsReview ? "border-luxuryGold/40 ring-1 ring-luxuryGold/10" : "border-luxuryMaroon/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3.5 text-left">
                    <div>
                      <h3 className="text-sm md:text-base lg:text-lg font-black text-white leading-tight">
                        {mission.title}
                      </h3>
                      <p className="mt-1 text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {roleLabel}
                      </p>
                    </div>
                    <span className={`rounded-md border px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-black uppercase tracking-wider shrink-0 h-fit ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Timing & Location */}
                  <div className="grid grid-cols-2 gap-3.5 text-xs md:text-sm font-bold text-cotton/80 mb-4.5 text-left">
                    <div className="flex items-center gap-2.5 rounded-xl border border-luxuryMaroon/15 bg-[#1B1716]/40 p-2.5 md:p-3.5">
                      <CalendarClock className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 text-luxuryGold shrink-0" />
                      <span className="text-cotton/90">
                        {isSolo ? "Start Anytime" : (due ? "Ready" : timeLeft(mission.datetime))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl border border-luxuryMaroon/15 bg-[#1B1716]/40 p-2.5 md:p-3.5">
                      <MapPin className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 text-cherryRed shrink-0" />
                      <span className="truncate text-cotton/90">
                        {isSolo ? "Solo Runway" : mission.location}
                      </span>
                    </div>
                  </div>

                  {/* 1. Request Review Box (Creator Only) */}
                  {isCreator && isRequest && !isSolo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-3.5 rounded-xl border border-luxuryGold/20 bg-luxuryGold/5 p-3 md:p-4.5 text-left space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cotton">
                            Join Request Received
                          </p>
                          <p className="text-[9px] md:text-xs text-zinc-500 font-semibold mt-0.5">
                            Dept: {mission.participant_department}
                          </p>
                        </div>
                        <div className="rounded-lg border border-cherryRed/20 bg-cherryRed/5 px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-black text-cherryRed flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> {mission.participant_reputation} Aura
                        </div>
                      </div>
                      
                      <button
                        onClick={() => mission.participant_id && handleApprove(mission.id, mission.participant_id)}
                        className="flex h-9 md:h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-cherryRed text-[10px] md:text-xs font-black uppercase tracking-wider text-cotton transition hover:bg-cherryRed/95"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" /> Approve Request
                      </button>
                    </motion.div>
                  )}

                  {/* 2. Participant Request Pending state */}
                  {!isCreator && isRequest && (
                    <div className="mb-3.5 rounded-xl border border-luxuryMaroon/15 bg-luxuryMaroon/5 p-3.5 md:p-4.5 text-center">
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
                      {isSolo ? (
                        <div className="rounded-xl border border-cherryRed/20 bg-cherryRed/5 p-4 text-center">
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cotton">
                            SOLO RUNWAY READY
                          </p>
                          <p className="text-[9px] md:text-xs text-zinc-500 font-semibold mt-1">
                            Ready to lock in? Start your focus session now.
                          </p>
                          <button
                            onClick={() => handleAttendance(mission.id, true)}
                            disabled={submitting[mission.id]}
                            className="mt-3.5 w-full flex h-10 items-center justify-center gap-1.5 rounded-lg bg-cherryRed text-xs font-black uppercase tracking-wider text-cotton shadow-[0_0_15px_rgba(129,1,0,0.15)] hover:bg-[#810100]/95 transition active:scale-[0.98]"
                          >
                            <Check className="h-4 w-4 stroke-[3]" /> Start Focus Session
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Creator Code display */}
                          {isCreator && due && (
                            <div className="rounded-xl border border-cherryRed/20 bg-cherryRed/5 p-3.5 md:p-4.5 text-center">
                              <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cotton">
                                Meetup Verification Code
                              </p>
                              <p className="text-[9px] md:text-xs text-zinc-500 font-semibold mt-0.5">
                                Share this OTP with {mission.participant_name} to check in:
                              </p>
                              <div className="mt-2.5 text-2xl md:text-3xl font-black tracking-widest text-cherryRed bg-black/40 rounded-lg py-1 md:py-2.5 max-w-[120px] md:max-w-[150px] mx-auto border border-cherryRed/20 shadow-[0_0_15px_rgba(129,1,0,0.1)]">
                                {mission.verification_code}
                              </div>
                            </div>
                          )}

                          {/* Participant OTP Entry box */}
                          {!isCreator && due && (
                            <div className="rounded-xl border border-luxuryGold/20 bg-luxuryGold/5 p-3.5 md:p-4.5 text-left space-y-2.5">
                              <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cotton">
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
                                  className="h-9 md:h-11 w-24 md:w-32 rounded-lg border border-luxuryMaroon/20 bg-[#1B1716]/40 text-center text-sm md:text-base font-black tracking-widest text-cotton outline-none focus:border-luxuryGold"
                                />
                                <button
                                  onClick={() => handleAttendance(mission.id, true)}
                                  disabled={submitting[mission.id]}
                                  className="flex-1 flex h-9 md:h-11 items-center justify-center gap-1.5 rounded-lg bg-cherryRed text-[10px] md:text-xs font-black uppercase tracking-wider text-cotton transition hover:bg-cherryRed/95 disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Verify & Check In
                                </button>
                              </div>
                            </div>
                          )}

                          {errors[mission.id] && (
                            <p className="text-[10px] md:text-xs font-bold text-cherryRed text-center">
                              {errors[mission.id]}
                            </p>
                          )}

                          {/* Creator control: can mark participant as missed */}
                          {isCreator && due && (
                            <button
                              onClick={() => handleAttendance(mission.id, false, mission.participant_id)}
                              disabled={submitting[mission.id]}
                              className="flex h-9 md:h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-cherryRed/30 bg-cherryRed/5 text-[10px] md:text-xs font-black uppercase tracking-wider text-cherryRed hover:bg-cherryRed/10 transition disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5 stroke-[3]" /> Participant No-Show
                            </button>
                          )}

                          {/* Participant self-report missed */}
                          {!isCreator && due && (
                            <button
                              onClick={() => handleAttendance(mission.id, false)}
                              disabled={submitting[mission.id]}
                              className="flex h-9 md:h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-luxuryMaroon/20 bg-luxuryMaroon/5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-cotton/80 hover:text-cotton hover:bg-luxuryMaroon/15 transition disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5 stroke-[2]" /> I missed this meetup
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Executing Status Workspace */}
                  {mission.status === "Executing" && (
                    <div className="mt-3.5 space-y-3">
                      <div className="rounded-xl border border-luxuryGold/25 bg-luxuryGold/5 p-3 text-center">
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-cotton">
                          LOCKED IN & EXECUTING
                        </p>
                        <p className="text-[9px] md:text-xs text-zinc-500 font-semibold mt-1">
                          You are currently focused on this mission. Complete your work below.
                        </p>
                      </div>

                      {/* Checklist Tasks */}
                      <div className="mt-3 space-y-2 text-left bg-black/30 p-3.5 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                            Task Checklist
                          </h4>
                          {missionTasks[mission.id] && (
                            <span className="text-[10px] font-black text-luxuryGold">
                              {missionTasks[mission.id].filter(t => t.completed).length} / {missionTasks[mission.id].length} Done
                            </span>
                          )}
                        </div>
                        
                        {/* Task input to add a task on the fly */}
                        <div className="flex gap-2">
                          <Input
                            value={newTaskTitles[mission.id] || ""}
                            onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [mission.id]: e.target.value }))}
                            placeholder="Add new checklist item..."
                            className="h-8 border-white/5 bg-black/40 text-[11px] text-white"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTask(mission.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTask(mission.id)}
                            className="h-8 px-2.5 rounded-lg bg-luxuryMaroon/15 border border-luxuryMaroon/30 text-[10px] text-cotton font-black hover:bg-luxuryMaroon/30 transition shrink-0"
                          >
                            Add
                          </button>
                        </div>

                        {loadingTasks[mission.id] ? (
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center py-2 animate-pulse">Syncing tasks...</p>
                        ) : (missionTasks[mission.id] || []).length === 0 ? (
                          <p className="text-[10px] text-zinc-600 font-semibold text-center py-2">No tasks added to checklist.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto mt-2">
                            {(missionTasks[mission.id] || []).map((t) => (
                              <div key={t.id} className="flex justify-between items-center bg-zinc-900/40 p-2 rounded-lg border border-white/5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(mission.id, t.id)}
                                  className="flex items-center gap-2.5 text-[11px] font-semibold text-cotton/90 text-left truncate flex-1"
                                >
                                  {t.completed ? (
                                    <CheckSquare className="h-4 w-4 text-luxuryGold shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-zinc-500 shrink-0" />
                                  )}
                                  <span className={t.completed ? "line-through text-zinc-500" : ""}>{t.title}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(mission.id, t.id)}
                                  className="text-zinc-600 hover:text-cherryRed p-1 transition shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Checkout / Finish form */}
                      <div className="rounded-xl border border-luxuryMaroon/20 bg-noirBlack/40 p-4 space-y-3 text-left">
                        {(missionTasks[mission.id] || []).length > 0 ? (
                          <div className="flex justify-between items-center rounded-lg border border-white/5 bg-black/40 p-3 text-xs">
                            <span className="font-bold text-zinc-400">Total Completed:</span>
                            <span className="font-black text-luxuryGold text-sm">
                              {(missionTasks[mission.id] || []).filter(t => t.completed).length} / {(missionTasks[mission.id] || []).length} Tasks
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1 text-left">
                            <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500">
                              Tasks Completed
                            </label>
                            <select
                              value={tasksCompletedInput[mission.id] || "0"}
                              onChange={(e) => setTasksCompletedInput({ ...tasksCompletedInput, [mission.id]: e.target.value })}
                              className="h-10 w-full rounded-lg border border-luxuryMaroon/20 bg-zinc-950 text-xs text-cotton outline-none focus:border-luxuryGold px-2"
                            >
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <option key={n} value={String(n)} className="bg-zinc-950 text-cotton">{n} Tasks Completed</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button
                          onClick={() => initiateFinishSession(mission)}
                          className="w-full flex h-10 items-center justify-center gap-1.5 rounded-lg bg-luxuryGold text-xs font-black uppercase tracking-wider text-black transition hover:bg-luxuryGold/95"
                        >
                          Complete Focus Session
                        </button>
                      </div>

                      {/* Optional vibe check rating if they want extra aura */}
                      {!isSolo && (!!mission.participant_name || !!mission.creator_name) && (
                        <div className="rounded-xl border border-luxuryMaroon/15 bg-luxuryMaroon/5 p-3.5 space-y-2">
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
                              className="flex-1 flex h-8 items-center justify-center gap-1 rounded-lg border border-cherryRed/20 bg-cherryRed/5 text-[10px] font-bold text-cherryRed hover:bg-cherryRed/10 transition"
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
                      {!isSolo && (
                        <button
                          onClick={() => setChatMission(mission)}
                          className="flex-1 flex h-9 md:h-11 items-center justify-center gap-2.5 rounded-xl border border-luxuryMaroon/20 bg-luxuryMaroon/5 text-xs md:text-sm font-bold text-cotton/80 hover:text-cotton hover:bg-luxuryMaroon/15 transition"
                        >
                          <MessageSquare className="h-4 w-4 md:h-4.5 md:w-4.5 text-luxuryGold" />
                          <span>Rendezvous Chat</span>
                        </button>
                      )}

                      {mission.status === "Completed" && (
                        <button
                          onClick={() => handleViewMissionRecap(mission.id)}
                          className="flex-1 flex h-9 md:h-11 items-center justify-center gap-2.5 rounded-xl border border-luxuryGold/30 bg-luxuryGold/5 text-xs md:text-sm font-bold text-luxuryGold hover:bg-luxuryGold/15 transition"
                        >
                          <Trophy className="h-4 w-4 text-luxuryGold" />
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

      {/* Reflection Modal Dialog */}
      <Dialog open={!!activeReflectionMission} onOpenChange={(open) => !open && setActiveReflectionMission(null)}>
        <DialogContent className="border-white/10 bg-zinc-950/95 text-white max-w-sm rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
              <FileText className="h-5 w-5 text-luxuryGold" />
              FOCUS REFLECTION
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-left">
            <div>
              <p className="text-[11px] font-bold text-zinc-400">
                Runway: {activeReflectionMission?.title}
              </p>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                Tasks Completed: {
                  activeReflectionMission ? (
                    (missionTasks[activeReflectionMission.id] || []).length > 0 
                      ? (missionTasks[activeReflectionMission.id] || []).filter(t => t.completed).length 
                      : Number(tasksCompletedInput[activeReflectionMission.id] || 0)
                  ) : 0
                }
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                How did it go? (Reflection)
              </label>
              <Textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Briefly reflect on your focus, distractions, and progress..."
                className="min-h-20 border-white/10 bg-black/40 text-xs text-white resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                Lessons Learned / Takeaways
              </label>
              <Textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="What did you learn or what will you optimize next session?"
                className="min-h-20 border-white/10 bg-black/40 text-xs text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Make Reflection Public</span>
              <button
                type="button"
                onClick={() => setIsPublicReflection(!isPublicReflection)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPublicReflection ? "bg-cherryRed" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPublicReflection ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={submitFinishSession}
              disabled={submittingReflection}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-luxuryGold/30 bg-luxuryGold text-xs font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(197,168,128,0.2)] hover:bg-luxuryGold/95 transition active:scale-[0.98] disabled:opacity-50"
            >
              {submittingReflection ? "Finalizing..." : "Complete & Save"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
