"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, MapPin, Check, X, MessageSquare, ShieldAlert, AlertCircle, Sparkles, Trophy, Plus, Trash2, Flame, Play, Pause, Calendar, Download } from "lucide-react";
import { User, Mission } from "../app/types";
import { uploadImage } from "../lib/supabase";
import Chat from "./Chat";
import RecapCard from "./RecapCard";
import PublicProfile from "./PublicProfile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input, fieldClass } from "./ui/input";
import { CountUp, Portal, Reveal, Skeleton } from "./ui/motion";
import { LockinMark } from "./ui/LockinLogo";
import { spring } from "../lib/motion";
import { Textarea } from "./ui/textarea";
import { POINTS_NAME } from "../lib/brand";

interface ActiveMissionsProps {
  user: User;
  refreshUser: () => Promise<void>;
  api: (path: string, options?: RequestInit) => Promise<any>;
  socketUrl: string;
}

export default function ActiveMissions({ user, refreshUser, api, socketUrl }: ActiveMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [chatMission, setChatMission] = useState<Mission | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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
  
  // V2 reflection attachments & exit states
  const [reflectionDuration, setReflectionDuration] = useState<number>(25);
  const [isFailedRun, setIsFailedRun] = useState<boolean>(false);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [attachLink, setAttachLink] = useState<string>("");

  // Timer V2 states
  const [activeFocusMission, setActiveFocusMission] = useState<Mission | null>(null);
  const [activeTimerDuration, setActiveTimerDuration] = useState<number>(1500); // default 25 min
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(1500);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [showTimerSelector, setShowTimerSelector] = useState<number | null>(null);

  // Exact target timestamp refs to survive background tab throttling
  const endTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Timer Tick Effect (survives tab switching and background throttling)
  useEffect(() => {
    let interval: any = null;

    if (timerRunning && activeFocusMission) {
      if (activeTimerDuration > 0) {
        if (!endTimeRef.current) {
          endTimeRef.current = Date.now() + timeLeftSeconds * 1000;
        }
      } else {
        if (!startTimeRef.current) {
          startTimeRef.current = Date.now() - timeLeftSeconds * 1000;
        }
      }

      const syncTick = () => {
        if (activeTimerDuration > 0 && endTimeRef.current) {
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
          setTimeLeftSeconds(remaining);
          if (remaining <= 0) {
            setTimerRunning(false);
            endTimeRef.current = null;
            if (typeof window !== "undefined") {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = "sine";
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
              } catch (e) {
                console.warn("AudioContext block", e);
              }
            }
          }
        } else if (activeTimerDuration === 0 && startTimeRef.current) {
          const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
          setTimeLeftSeconds(elapsed);
        }
      };

      // Immediate tick to sync
      syncTick();
      interval = setInterval(syncTick, 1000);

      // Visibility change handler to instantly snap back to real time when user reopens tab
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          syncTick();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    } else {
      endTimeRef.current = null;
      startTimeRef.current = null;
    }

    return () => clearInterval(interval);
  }, [timerRunning, activeFocusMission, activeTimerDuration]);

  // Sync to/from localStorage
  useEffect(() => {
    if (!user) return;
    const key = `lockin_timer_${user.id}`;
    if (activeFocusMission) {
      localStorage.setItem(key, JSON.stringify({
        missionId: activeFocusMission.id,
        duration: activeTimerDuration,
        timeLeft: timeLeftSeconds,
        running: timerRunning,
        lastSaved: Date.now()
      }));
    } else {
      localStorage.removeItem(key);
    }
  }, [activeFocusMission, activeTimerDuration, timeLeftSeconds, timerRunning, user]);

  // Restore timer state on load
  useEffect(() => {
    if (!user || loading) return;
    const key = `lockin_timer_${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const mission = missions.find(m => m.id === state.missionId);
        if (mission && mission.status === "Executing") {
          setActiveFocusMission(mission);
          setActiveTimerDuration(state.duration);
          
          let nextTime = state.timeLeft;
          if (state.running) {
            const elapsed = Math.floor((Date.now() - state.lastSaved) / 1000);
            if (state.duration > 0) {
              nextTime = Math.max(0, state.timeLeft - elapsed);
            } else {
              nextTime = state.timeLeft + elapsed;
            }
          }
          setTimeLeftSeconds(nextTime);
          setTimerRunning(nextTime > 0 || state.duration === 0 ? state.running : false);
        } else {
          localStorage.removeItem(key);
        }
      } catch (err) {
        console.error("Failed to restore timer state", err);
      }
    }
  }, [missions, user, loading]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

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
    let elapsed = 0;
    if (activeFocusMission && activeFocusMission.id === mission.id) {
      elapsed = activeTimerDuration > 0 ? activeTimerDuration - timeLeftSeconds : timeLeftSeconds;
    } else {
      elapsed = (mission.focus_duration || 25) * 60;
    }
    const actualMins = Math.max(1, Math.round(elapsed / 60));

    let failed = false;
    if (activeFocusMission && activeFocusMission.id === mission.id && activeTimerDuration > 0) {
      const tasksList = missionTasks[mission.id] || [];
      const tasksCompleted = tasksList.filter(t => t.completed).length;
      const underHalf = elapsed < (activeTimerDuration * 0.5);
      const noTasks = tasksCompleted === 0;
      const underThreeMins = elapsed < 180;
      if ((underHalf && noTasks) || underThreeMins) {
        failed = true;
      }
    }

    if (activeFocusMission && activeFocusMission.id === mission.id && activeTimerDuration > 0 && timeLeftSeconds > 0) {
      const confirmEnd = window.confirm(
        "Are you sure you want to end before the target time?\n\n" +
        `You have only focused for ${actualMins} minute(s).\n` +
        (failed ? `WARNING: This will count as a RUNWAY CRASH (-5 ${POINTS_NAME}).` : "")
      );
      if (!confirmEnd) return;
    }

    setReflectionDuration(actualMins);
    setIsFailedRun(failed);
    setActiveReflectionMission(mission);
    setReflectionText("");
    setLessonsLearned("");
    setIsPublicReflection(true);
    setScreenshotBase64(null);
    setAttachLink("");
  }

  async function submitFinishSession() {
    if (!activeReflectionMission) return;
    setSubmittingReflection(true);
    try {
      const missionId = activeReflectionMission.id;
      const tasksList = missionTasks[missionId] || [];
      const tasksCompleted = tasksList.length > 0
        ? tasksList.filter(t => t.completed).length
        : Number(tasksCompletedInput[missionId] || 0);

      const result = await api(`/missions/${missionId}/finish`, {
        method: "POST",
        body: JSON.stringify({
          tasksCompleted,
          // The server measures the session and decides crash vs. complete;
          // this only tells it which timer you picked (0 = open-ended).
          targetMinutes: activeFocusMission && activeFocusMission.id === missionId ? Math.round(activeTimerDuration / 60) : 0,

          reflection: {
            reflectionText: reflectionText.trim() || null,
            lessonsLearned: lessonsLearned.trim() || null,
            isPublic: isPublicReflection,
            screenshot: screenshotBase64,
            link: attachLink.trim() || null
          }
        })
      });

      setRecapData(result);
      setShowRecapCard(true);
      setActiveReflectionMission(null);
      setActiveFocusMission(null);
      setTimerRunning(false);
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
        body: JSON.stringify({ rating })
      });
      setErrors((prev) => ({ ...prev, [missionId]: "" }));
      await Promise.all([load(), refreshUser()]);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [missionId]: err.message || "Couldn't save your rating." }));
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
        body: JSON.stringify({ participantId })
      });
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to approve request.");
    }
  }

  async function handleAttendance(missionId: number, showedUp: boolean, targetParticipantId?: number) {
    const code = inputCodes[missionId] || "";

    setErrors((prev) => ({ ...prev, [missionId]: "" }));
    setSubmitting((prev) => ({ ...prev, [missionId]: true }));

    try {
      await api(`/missions/${missionId}/attendance`, {
        method: "POST",
        body: JSON.stringify({ showedUp, code, ...(targetParticipantId ? { participantId: targetParticipantId } : {}) })
      });
      const updatedList = await api(`/missions/active/${user.id}`);
      setMissions(updatedList);
      await refreshUser();

      // Automatically enter fullscreen focus mode if session is now executing
      if (showedUp) {
        const currentM = updatedList.find((m: any) => m.id === missionId);
        if (currentM && currentM.status === "Executing") {
          setActiveFocusMission(currentM);
          if (showTimerSelector === missionId) {
            setTimerRunning(true);
          } else {
            setActiveTimerDuration(0);
            setTimeLeftSeconds(0);
            setTimerRunning(true);
          }
        }
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [missionId]: err.message || "Failed to submit." }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [missionId]: false }));
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const getGoogleCalendarUrl = (mission: Mission) => {
    const title = encodeURIComponent(mission.title || "LockIn Mission");
    const descText = `${mission.description || ""}\n\nHost: ${mission.creator_name || "Unknown"}\nLocation: ${mission.location || "Runway"}\nLocked in with: ${mission.participant_name || "Solo"}`;
    const details = encodeURIComponent(descText);
    const location = encodeURIComponent(mission.location || "");
    
    const startDate = mission.datetime ? new Date(mission.datetime) : new Date();
    const isValidDate = !isNaN(startDate.getTime());
    const actualStart = isValidDate ? startDate : new Date();
    const durationMin = mission.focus_duration || 60;
    const endDate = new Date(actualStart.getTime() + durationMin * 60 * 1000);
    
    const formatGCalDate = (date: Date) => {
      try {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      } catch (e) {
        return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      }
    };
    
    const dates = `${formatGCalDate(actualStart)}/${formatGCalDate(endDate)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const downloadICS = (mission: Mission) => {
    const title = mission.title || "LockIn Mission";
    const descText = `${mission.description || ""}\n\nHost: ${mission.creator_name || "Unknown"}\nLocation: ${mission.location || "Runway"}\nLocked in with: ${mission.participant_name || "Solo"}`;
    const location = mission.location || "Runway";
    
    const startDate = mission.datetime ? new Date(mission.datetime) : new Date();
    const isValidDate = !isNaN(startDate.getTime());
    const actualStart = isValidDate ? startDate : new Date();
    const durationMin = mission.focus_duration || 60;
    const endDate = new Date(actualStart.getTime() + durationMin * 60 * 1000);
    
    const formatICSDate = (date: Date) => {
      try {
        return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      } catch (e) {
        return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      }
    };
    
    const escapeICS = (str: string) => {
      return str
        .replace(/[\\,;]/g, (match) => `\\${match}`)
        .replace(/\n/g, "\\n");
    };
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LockIn//Mission Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:mission-${mission.id}@lockin.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(actualStart)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(title)}`,
      `DESCRIPTION:${escapeICS(descText)}`,
      `LOCATION:${escapeICS(location)}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) || "mission";
    link.download = `${safeTitle}.ics`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isDue = (datetime?: string | null) => {
    if (!datetime) return true;
    return new Date(datetime).getTime() <= Date.now();
  };

  // Matches the server: check-in opens 15 minutes before the start time.
  const checkInOpen = (datetime?: string | null) => {
    if (!datetime) return true;
    return new Date(datetime).getTime() - 15 * 60e3 <= Date.now();
  };

  const timeLeft = (datetime?: string | null) => {
    if (!datetime) return "Ready";
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

  const pendingRequests = missions.filter((m) => m.role === "creator" && m.status === "Requested").length;
  const completedCount = missions.filter((m) => m.status === "Completed").length;

  return (
    <section className="mx-auto w-full max-w-md flex-1 space-y-6 px-5 pt-2 md:max-w-[1240px] md:px-12 md:pt-14 md:space-y-10">
      {/* Title */}
      <div>
        <p className="t-section">Queue</p>
        <h1 className="t-display mt-3 text-large-title text-ink md:mt-6 md:text-[88px] md:leading-[0.92] md:tracking-[-0.045em]">Your missions</h1>
        <p className="mt-1 text-subhead text-ink-3 md:mt-5 md:text-body">
          {missions.length - completedCount} open · <CountUp value={completedCount} className="text-ink-2" /> completed
        </p>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {pendingRequests > 0 && (
          <Alert key="req" icon={AlertCircle} title={`${pendingRequests} join request${pendingRequests > 1 ? "s" : ""} waiting`} body="Approve who locks in with you. They're below." />
        )}
        {pendingReviews > 0 && (
          <Alert
            key="att"
            icon={ShieldAlert}
            title="Check-in needed"
            body={`${pendingReviews} mission${pendingReviews > 1 ? "s are" : " is"} due. Confirm who showed up.`}
          />
        )}
      </AnimatePresence>

      {/* Queue */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-64 rounded-card" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-card border border-dashed border-line bg-surface/50 px-8 py-16 text-center"
        >
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <LockinMark size={56} color="rgb(var(--ink-3))" />
          </motion.div>
          <h2 className="t-display mt-6 text-title-1 text-ink">Nothing queued</h2>
          <p className="mt-2 max-w-[260px] text-subhead leading-relaxed text-ink-2">
            Lock in to a mission from the deck, or launch your own. It'll show up here.
          </p>
        </motion.div>
      ) : (
        <Reveal className="grid grid-cols-1 gap-4 md:grid-cols-2" each={0.06}>
          {missions.map((mission) => {
            const isSolo = mission.mission_type === "solo";
            const due = isDue(mission.datetime) || isSolo;
            const isCreator = mission.role === "creator" || isSolo;
            const isRequest = mission.status === "Requested";
            const active = mission.status === "Accepted";
            const executing = mission.status === "Executing";
            const needsReview = mission.showed_up === null && due && active && !isSolo;
            const canCheckIn = isSolo || checkInOpen(mission.datetime);
            // A group host runs no session of their own: their partner checks in and finishes.
            const hostOfGroup = isCreator && !isSolo;
            const myRating = hostOfGroup ? mission.creator_vibe_rating : mission.participant_vibe_rating;
            const canRate = !isSolo && (executing || mission.status === "Completed") && !myRating;
            const tasks = missionTasks[mission.id] || [];
            const doneTasks = tasks.filter((t) => t.completed).length;

            const status = isRequest
              ? { label: "Requested", cls: "border-line bg-raised text-ink-2" }
              : active
                ? { label: isSolo ? "Ready" : due ? "Due now" : "Upcoming", cls: due ? "border-signal/70 bg-surface text-crimson" : "border-line bg-raised text-ink" }
                : executing
                  ? { label: "Locked in", cls: "border-signal text-ink", live: true }
                  : mission.status === "Completed"
                    ? { label: "Completed", cls: "border-success/40 bg-success/10 text-success" }
                    : mission.status === "Missed"
                      ? { label: "Missed", cls: "border-line bg-raised text-ink-3 line-through" }
                      : { label: mission.status || "Pending", cls: "border-line bg-raised text-ink-2" };

            const roleLabel = isSolo
              ? "Solo"
              : isCreator
                ? mission.status === "Pending" ? "Hosting" : `Hosting · with ${mission.participant_name}`
                : `With ${mission.creator_name}`;

            return (
              <Reveal.Item key={`${mission.id}-${mission.role}-${mission.participant_id ?? "self"}`}>
                <motion.article
                  layout
                  className={`relative overflow-hidden rounded-card border bg-surface ${
                    executing ? "border-signal/70" : needsReview ? "border-signal/70" : "border-line"
                  }`}
                >
                  {/* Cover strip */}
                  <div
                    className="h-px w-full"
                    style={{
                      background: mission.cover_color
                        ? mission.cover_color
                        : mission.cover_image?.includes("gradient")
                          ? mission.cover_image
                          : "linear-gradient(90deg, rgb(var(--cherry)), rgb(var(--signal)))"
                    }}
                  />

                  <div className="space-y-5 p-5">
                    {/* Head */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="t-display text-title-2 text-ink">{mission.title}</h3>
                        <p className="mt-1.5 truncate text-subhead text-ink-3">{roleLabel}</p>
                      </div>
                      <span className={`flex h-7 shrink-0 items-center gap-1.5 rounded-sm border px-2.5 text-[10px] font-medium uppercase tracking-[0.2em] ${status.cls}`}>
                        {status.live && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
                          </span>
                        )}
                        {status.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-subhead text-ink">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-ink-3" />
                        {isSolo ? "Start anytime" : due ? "Now" : `In ${timeLeft(mission.datetime)}`}
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-crimson" />
                        <span className="truncate">{isSolo ? "Wherever you are" : mission.location}</span>
                      </span>
                    </div>

                    {/* Crew */}
                    {mission.attendees && mission.attendees.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {mission.attendees.slice(0, 4).map((a, i) => (
                            <motion.button
                              key={a.id}
                              type="button"
                              onClick={() => setSelectedUserId(a.id)}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ ...spring.pop, delay: 0.1 + i * 0.05 }}
                              whileHover={{ y: -3, zIndex: 10 }}
                              aria-label={`View ${a.name}`}
                              className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-raised font-display text-title-3 font-bold text-ink"
                            >
                              {getInitials(a.name)}
                            </motion.button>
                          ))}
                        </div>
                        <span className="text-subhead text-ink-2">
                          {mission.attendees.length} locked in
                        </span>
                      </div>
                    )}

                    {/* Calendar */}
                    {!isSolo && mission.status !== "Completed" && mission.status !== "Missed" && !executing && (
                      <div className="flex gap-2">
                        <a
                          href={getGoogleCalendarUrl(mission)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-subhead text-ink-2 transition-colors hover:border-ink-3/50 hover:text-ink"
                        >
                          <Calendar className="h-4 w-4" /> Google
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadICS(mission)}
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-subhead text-ink-2 transition-colors hover:border-ink-3/50 hover:text-ink"
                        >
                          <Download className="h-4 w-4" /> Apple / Outlook
                        </button>
                      </div>
                    )}

                    {/* Host: nobody yet */}
                    {mission.status === "Pending" && (
                      <Panel tone="muted">
                        <p className="text-subhead text-ink-2">Live on the deck. You'll see join requests here.</p>
                      </Panel>
                    )}

                    {/* Host: approve request */}
                    {isCreator && isRequest && !isSolo && (
                      <Panel>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-headline text-ink">Wants to join</p>
                            <p className="mt-0.5 text-subhead text-ink-3">{mission.participant_department}</p>
                          </div>
                          <span className="flex items-center gap-1.5 rounded-sm border border-gold/30 bg-gold/10 px-3 py-1 text-footnote font-semibold text-gold">
                            <Sparkles className="h-3.5 w-3.5" /> {mission.participant_reputation} {POINTS_NAME}
                          </span>
                        </div>
                        <ActionButton onClick={() => mission.participant_id && handleApprove(mission.id, mission.participant_id)}>
                          <Check className="h-5 w-5" strokeWidth={2.75} /> Approve
                        </ActionButton>
                      </Panel>
                    )}

                    {/* Participant: waiting */}
                    {!isCreator && isRequest && (
                      <Panel tone="muted">
                        <div className="flex items-center gap-3">
                          <motion.span
                            className="h-2 w-2 shrink-0 rounded-full bg-ink-3"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                          />
                          <p className="text-subhead text-ink-2">Waiting for {mission.creator_name} to approve you.</p>
                        </div>
                      </Panel>
                    )}

                    {/* Accepted */}
                    {active && (
                      <div className="space-y-3">
                        {isSolo ? (
                          <Panel>
                            <AnimatePresence mode="wait" initial={false}>
                              {showTimerSelector === mission.id ? (
                                <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                                  <p className="t-label">How long?</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { label: "25 min", value: 25 },
                                      { label: "50 min", value: 50 },
                                      { label: "90 min", value: 90 },
                                      { label: "Open", value: 0 }
                                    ].map((opt, i) => (
                                      <motion.button
                                        key={opt.label}
                                        type="button"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ ...spring.pop, delay: i * 0.04 }}
                                        whileTap={{ scale: 0.94 }}
                                        onClick={async () => {
                                          setActiveTimerDuration(opt.value * 60);
                                          setTimeLeftSeconds(opt.value * 60);
                                          setShowTimerSelector(null);
                                          await handleAttendance(mission.id, true);
                                        }}
                                        className="h-14 rounded-xl border border-line bg-raised text-title-3 font-semibold text-ink transition-colors hover:border-signal hover:bg-surface"
                                      >
                                        {opt.label}
                                      </motion.button>
                                    ))}
                                  </div>
                                  <button type="button" onClick={() => setShowTimerSelector(null)} className="h-10 w-full text-subhead text-ink-3 hover:text-ink">
                                    Cancel
                                  </button>
                                </motion.div>
                              ) : (
                                <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  <ActionButton onClick={() => setShowTimerSelector(mission.id)} disabled={submitting[mission.id]}>
                                    <Play className="h-5 w-5 fill-current" /> Start session
                                  </ActionButton>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Panel>
                        ) : (
                          <>
                            {isCreator && canCheckIn && (
                              <Panel>
                                <p className="t-label">Check-in code</p>
                                <p className="mt-1 text-subhead text-ink-2">Give this to {mission.participant_name} when they arrive.</p>
                                <div className="mt-4 flex justify-center gap-2" aria-label={`Code ${String(mission.verification_code ?? "").split("").join(" ")}`}>
                                  {String(mission.verification_code ?? "----").split("").map((d, i) => (
                                    <motion.span
                                      key={i}
                                      initial={{ rotateX: -90, opacity: 0 }}
                                      animate={{ rotateX: 0, opacity: 1 }}
                                      transition={{ ...spring.pop, delay: i * 0.08 }}
                                      className="t-display tabular flex h-16 w-14 items-center justify-center rounded-xl border border-signal/70 bg-bg text-large-title text-crimson"
                                    >
                                      {d}
                                    </motion.span>
                                  ))}
                                </div>
                              </Panel>
                            )}

                            {!isCreator && canCheckIn && (
                              <Panel>
                                <p className="t-label">Enter check-in code</p>
                                <p className="mt-1 text-subhead text-ink-2">Get the 4 digits from {mission.creator_name}.</p>
                                <CodeInput
                                  value={inputCodes[mission.id] || ""}
                                  onChange={(v) => setInputCodes({ ...inputCodes, [mission.id]: v })}
                                />
                                <ActionButton
                                  onClick={() => handleAttendance(mission.id, true)}
                                  disabled={submitting[mission.id] || (inputCodes[mission.id] || "").length < 4}
                                >
                                  <Check className="h-5 w-5" strokeWidth={2.75} /> Check in
                                </ActionButton>
                              </Panel>
                            )}

                            <AnimatePresence>
                              {errors[mission.id] && (
                                <motion.p
                                  role="alert"
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: [0, -6, 6, 0] }}
                                  exit={{ opacity: 0 }}
                                  className="text-center text-subhead font-medium text-crimson"
                                >
                                  {errors[mission.id]}
                                </motion.p>
                              )}
                            </AnimatePresence>

                            {!canCheckIn && (
                              <Panel tone="muted">
                                <p className="text-subhead text-ink-2">
                                  {isCreator ? "Your check-in code appears" : "Check-in opens"} 15 minutes before the start.
                                </p>
                              </Panel>
                            )}

                            {canCheckIn && (
                              <button
                                type="button"
                                onClick={() => (isCreator ? handleAttendance(mission.id, false, mission.participant_id) : handleAttendance(mission.id, false))}
                                disabled={submitting[mission.id]}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-subhead text-ink-3 transition-colors hover:bg-raised hover:text-ink disabled:opacity-50"
                              >
                                <X className="h-4 w-4" /> {isCreator ? "They didn't show" : "I couldn't make it"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Executing: the participant (or solo) runs the session */}
                    {executing && !hostOfGroup && (
                      <div className="space-y-4">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setActiveFocusMission(mission);
                            if (activeFocusMission?.id !== mission.id) {
                              setActiveTimerDuration(0);
                              setTimeLeftSeconds(0);
                              setTimerRunning(true);
                            }
                          }}
                          className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-signal/70 bg-surface p-4 text-left"
                        >
                          <motion.span
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-signal/15 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="relative">
                            <span className="t-label">Focus mode</span>
                            <span className="t-display tabular mt-1 block text-title-1 text-ink">
                              {activeFocusMission?.id === mission.id ? formatTime(timeLeftSeconds) : "Enter"}
                            </span>
                          </span>
                          <Flame className="relative h-8 w-8 text-crimson transition-transform group-hover:scale-110" />
                        </motion.button>

                        <TaskList
                          tasks={tasks}
                          loading={loadingTasks[mission.id]}
                          newTitle={newTaskTitles[mission.id] || ""}
                          setNewTitle={(v) => setNewTaskTitles((prev) => ({ ...prev, [mission.id]: v }))}
                          onAdd={() => handleAddTask(mission.id)}
                          onToggle={(id) => handleToggleTask(mission.id, id)}
                          onDelete={(id) => handleDeleteTask(mission.id, id)}
                        />

                        {tasks.length === 0 && (
                          <div className="space-y-2">
                            <label htmlFor={`tc-${mission.id}`} className="t-label block">Tasks you finished</label>
                            <select
                              id={`tc-${mission.id}`}
                              value={tasksCompletedInput[mission.id] || "0"}
                              onChange={(e) => setTasksCompletedInput({ ...tasksCompletedInput, [mission.id]: e.target.value })}
                              className={`${fieldClass} h-12 appearance-none`}
                            >
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option key={n} value={String(n)} className="bg-surface text-ink">
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <ActionButton onClick={() => initiateFinishSession(mission)}>
                          <Check className="h-5 w-5" strokeWidth={2.75} /> Finish{tasks.length > 0 ? ` · ${doneTasks}/${tasks.length}` : ""}
                        </ActionButton>

                      </div>
                    )}

                    {/* Executing: the host follows along and keeps the shared checklist */}
                    {executing && hostOfGroup && (
                      <div className="space-y-4">
                        <Panel>
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
                            </span>
                            <p className="text-subhead text-ink-2">
                              <span className="text-ink">{mission.participant_name}</span> checked in and is locked in.
                            </p>
                          </div>
                        </Panel>
                        <TaskList
                          tasks={tasks}
                          loading={loadingTasks[mission.id]}
                          newTitle={newTaskTitles[mission.id] || ""}
                          setNewTitle={(v) => setNewTaskTitles((prev) => ({ ...prev, [mission.id]: v }))}
                          onAdd={() => handleAddTask(mission.id)}
                          onToggle={(id) => handleToggleTask(mission.id, id)}
                          onDelete={(id) => handleDeleteTask(mission.id, id)}
                        />
                      </div>
                    )}

                    {/* Rate the other person: during the session or after it ends */}
                    {canRate && (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                        <span className="pl-1 text-subhead text-ink-2">
                          Rate {hostOfGroup ? mission.participant_name : mission.creator_name}
                        </span>
                        <div className="flex gap-2">
                          <VibeButton onClick={() => handleVibeCheck(mission.id, "W")} label="W" sub="+2" good />
                          <VibeButton onClick={() => handleVibeCheck(mission.id, "L")} label="L" sub="−1" />
                        </div>
                      </div>
                    )}

                    {!active && errors[mission.id] && (
                      <p role="alert" className="text-center text-subhead font-medium text-crimson">
                        {errors[mission.id]}
                      </p>
                    )}

                    {/* Footer */}
                    {!isRequest && ((!isSolo && mission.status !== "Pending") || (mission.status === "Completed" && !hostOfGroup)) && (
                      <div className="flex gap-2 border-t border-line pt-4">
                        {!isSolo && mission.status !== "Pending" && (
                          <button
                            type="button"
                            onClick={() => setChatMission(mission)}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-subhead font-medium text-ink transition-colors hover:bg-raised"
                          >
                            <MessageSquare className="h-4 w-4 text-ink-3" /> Chat
                          </button>
                        )}
                        {mission.status === "Completed" && !hostOfGroup && (
                          <button
                            type="button"
                            onClick={() => handleViewMissionRecap(mission.id)}
                            className="btn-primary h-11 flex-1"
                          >
                            <Trophy className="h-4 w-4" /> Recap
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.article>
              </Reveal.Item>
            );
          })}
        </Reveal>
      )}

      <Portal>
      <AnimatePresence>
        {chatMission && <Chat mission={chatMission} user={user} onClose={() => setChatMission(null)} api={api} socketUrl={socketUrl} />}
      </AnimatePresence>
      </Portal>

      {recapData && <RecapCard isOpen={showRecapCard} onClose={() => setShowRecapCard(false)} recapData={recapData} />}

      {selectedUserId && (
        <PublicProfile userId={selectedUserId} viewerId={user.id} isOpen={!!selectedUserId} onClose={() => setSelectedUserId(null)} api={api} />
      )}

      {/* Reflection */}
      <Dialog open={!!activeReflectionMission} onOpenChange={(open) => !open && setActiveReflectionMission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session done</DialogTitle>
            <DialogDescription>
              {activeReflectionMission?.title} ·{" "}
              {activeReflectionMission
                ? (missionTasks[activeReflectionMission.id] || []).length > 0
                  ? (missionTasks[activeReflectionMission.id] || []).filter((t) => t.completed).length
                  : Number(tasksCompletedInput[activeReflectionMission.id] || 0)
                : 0}{" "}
              tasks finished
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="r-how" className="t-label block">How did it go?</label>
              <Textarea id="r-how" value={reflectionText} onChange={(e) => setReflectionText(e.target.value)} placeholder="What you got done, what got in the way." />
            </div>

            <div className="space-y-2">
              <label htmlFor="r-next" className="t-label block">Next time</label>
              <Textarea id="r-next" value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} placeholder="One thing you'd change." />
            </div>

            <div className="space-y-2">
              <p className="t-label">Proof</p>
              {screenshotBase64 ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-video w-full overflow-hidden rounded-xl border border-line">
                  <img src={screenshotBase64} alt="Attached screenshot" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setScreenshotBase64(null)}
                    aria-label="Remove screenshot"
                    className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-ink backdrop-blur"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-raised text-ink-3 transition-colors hover:border-ink-3/50 hover:text-ink-2">
                  <Plus className="h-5 w-5" />
                  <span className="text-subhead">Add a screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) {
                        uploadImage(file).then(setScreenshotBase64).catch((err) => alert(err.message));
                      }
                    }}
                  />
                </label>
              )}
              <Input type="url" inputMode="url" placeholder="Link (repo, doc, video)" value={attachLink} onChange={(e) => setAttachLink(e.target.value)} aria-label="Project link" />
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isPublicReflection}
              onClick={() => setIsPublicReflection(!isPublicReflection)}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-raised p-4 text-left"
            >
              <span>
                <span className="block text-subhead font-medium text-ink">Post to feed</span>
                <span className="block text-footnote text-ink-3">Your campus sees the recap.</span>
              </span>
              <span className={`relative flex h-7 w-12 shrink-0 items-center rounded-sm border border-line p-1 transition-colors ${isPublicReflection ? "bg-signal" : "bg-overlay"}`}>
                <motion.span layout transition={spring.snap} className={`h-5 w-5 rounded-sm bg-ink ${isPublicReflection ? "ml-auto" : ""}`} />
              </span>
            </button>

            <ActionButton onClick={submitFinishSession} disabled={submittingReflection}>
              {submittingReflection ? "Saving" : "Save recap"}
            </ActionButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen focus */}
      <Portal>
      <AnimatePresence>
        {activeFocusMission && (
          <FocusOverlay
            mission={activeFocusMission}
            time={formatTime(timeLeftSeconds)}
            progress={activeTimerDuration > 0 ? 1 - timeLeftSeconds / activeTimerDuration : (timeLeftSeconds % 3600) / 3600}
            countdown={activeTimerDuration > 0}
            running={timerRunning}
            onToggle={() => setTimerRunning(!timerRunning)}
            onMinimize={() => setActiveFocusMission(null)}
            onFinish={() => initiateFinishSession(activeFocusMission)}
          >
            <TaskList
              tasks={missionTasks[activeFocusMission.id] || []}
              newTitle={newTaskTitles[activeFocusMission.id] || ""}
              setNewTitle={(v) => setNewTaskTitles((prev) => ({ ...prev, [activeFocusMission.id]: v }))}
              onAdd={() => handleAddTask(activeFocusMission.id)}
              onToggle={(id) => handleToggleTask(activeFocusMission.id, id)}
            />
          </FocusOverlay>
        )}
      </AnimatePresence>
      </Portal>
    </section>
  );
}

/* ───────────────────────── Pieces ───────────────────────── */

function Alert({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={spring.glide}
      className="flex items-start gap-3 rounded-card border border-signal/70 bg-signal/[0.07] p-4"
    >
      <span className="relative mt-0.5 flex">
        <Icon className="h-5 w-5 text-crimson" />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-signal" />
      </span>
      <div>
        <p className="text-headline text-ink">{title}</p>
        <p className="mt-0.5 text-subhead leading-snug text-ink-2">{body}</p>
      </div>
    </motion.div>
  );
}

function Panel({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "muted" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 rounded-xl border p-4 ${tone === "muted" ? "border-line bg-raised/50" : "border-line bg-raised"}`}
    >
      {children}
    </motion.div>
  );
}

function ActionButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      transition={spring.snap}
      className="flex h-12 w-full items-center justify-center gap-2 btn-primary"
    >
      {children}
    </motion.button>
  );
}

function VibeButton({ onClick, label, sub, good }: { onClick: () => void; label: string; sub: string; good?: boolean }) {
  const [hit, setHit] = useState(false);
  return (
    <motion.button
      type="button"
      onClick={() => {
        setHit(true);
        onClick();
      }}
      whileTap={{ scale: 0.85 }}
      animate={hit ? { scale: [1, 1.2, 1] } : {}}
      transition={spring.pop}
      aria-label={`${label} vibe, ${sub} ${POINTS_NAME}`}
      className={`flex h-11 min-w-[64px] items-center justify-center gap-1 rounded-xl border px-3 font-display text-title-3 font-bold ${
        good ? "border-gold/40 bg-gold/10 text-gold" : "border-line bg-raised text-ink-2"
      }`}
    >
      {label}
      <span className="text-caption font-semibold opacity-70">{sub}</span>
    </motion.button>
  );
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        aria-label="4-digit check-in code"
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div className="flex justify-center gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => {
          const ch = value[i];
          const isCaret = i === value.length;
          return (
            <motion.div
              key={i}
              animate={ch ? { scale: [1.12, 1] } : { scale: 1 }}
              transition={spring.pop}
              className={`t-display tabular flex h-16 w-14 items-center justify-center rounded-xl border bg-bg text-large-title transition-colors ${
                ch ? "border-ink-3 text-ink" : isCaret ? "border-signal peer-focus:border-signal" : "border-line text-ink-3"
              }`}
            >
              {ch ?? (isCaret ? <motion.span className="h-7 w-[2px] bg-signal" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} /> : "")}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

type TaskT = { id: number; title: string; completed: boolean };

function TaskList({
  tasks,
  loading,
  newTitle,
  setNewTitle,
  onAdd,
  onToggle,
  onDelete
}: {
  tasks: TaskT[];
  loading?: boolean;
  newTitle: string;
  setNewTitle: (v: string) => void;
  onAdd: () => void;
  onToggle: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  const done = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? done / tasks.length : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="t-label">Checklist</p>
        {tasks.length > 0 && (
          <span className="tabular text-subhead font-medium text-ink-2">
            {done}/{tasks.length}
          </span>
        )}
      </div>
      {tasks.length > 0 && (
        <div className="h-px bg-line">
          <motion.div className="h-full rounded-full bg-signal" initial={false} animate={{ width: `${pct * 100}%` }} transition={spring.glide} />
        </div>
      )}

      {loading ? (
        <Skeleton className="h-12" />
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
                className="flex items-center gap-1 rounded-xl border border-line bg-bg/40 pr-1"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={t.completed}
                  onClick={() => onToggle(t.id)}
                  className="flex min-h-[48px] flex-1 items-center gap-3 px-3 text-left"
                >
                  <motion.span
                    animate={t.completed ? { scale: [0.8, 1.15, 1] } : { scale: 1 }}
                    transition={spring.pop}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-150 ${t.completed ? "border-signal bg-signal" : "border-ink-3/60 bg-transparent"}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                      <motion.path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        stroke="white"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={false}
                        animate={{ pathLength: t.completed ? 1 : 0, opacity: t.completed ? 1 : 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      />
                    </svg>
                  </motion.span>
                  <span className="relative min-w-0 truncate text-subhead text-ink">
                    <span className={t.completed ? "text-ink-3" : ""}>{t.title}</span>
                    <motion.span
                      className="absolute left-0 top-1/2 h-px w-full origin-left bg-ink-3"
                      initial={false}
                      animate={{ scaleX: t.completed ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                    />
                  </span>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(t.id)}
                    aria-label={`Delete ${t.title}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:text-crimson"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task"
          aria-label="New task"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          aria-label="Add task"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-raised text-ink transition-colors hover:bg-overlay"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}

function FocusOverlay({
  mission,
  time,
  progress,
  countdown,
  running,
  onToggle,
  onMinimize,
  onFinish,
  children
}: {
  mission: Mission;
  time: string;
  progress: number;
  countdown: boolean;
  running: boolean;
  onToggle: () => void;
  onMinimize: () => void;
  onFinish: () => void;
  children: React.ReactNode;
}) {
  const R = 130;
  const C = 2 * Math.PI * R;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="fixed inset-0 z-[990] flex select-none flex-col overflow-y-auto bg-bg text-ink"
      role="dialog"
      aria-modal="true"
      aria-label={`Focus: ${mission.title}`}
    >
      {/* Breathing atmosphere */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(60% 45% at 50% 40%, rgb(var(--cherry) / 0.16), transparent 70%)" }}
        animate={running ? { opacity: [0.5, 0.9, 0.5], scale: [1, 1.06, 1] } : { opacity: 0.25, scale: 1 }}
        transition={running ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.6 }}
      />

      <div className="relative flex items-center justify-between gap-4 px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <h2 className="t-display truncate text-title-2 text-ink">{mission.title}</h2>
        </div>
        <button
          type="button"
          onClick={onMinimize}
          className="flex h-11 shrink-0 items-center rounded-xl border border-line bg-surface/70 px-4 text-subhead font-medium text-ink-2 backdrop-blur transition-colors hover:text-ink"
        >
          Minimize
        </button>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-10 px-5 py-8">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring.glide, delay: 0.1 }}
          className="relative flex h-[300px] w-[300px] items-center justify-center"
        >
          <svg viewBox="0 0 300 300" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="150" cy="150" r={R} fill="none" stroke="rgb(var(--line))" strokeWidth="4" />
            <motion.circle
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke="rgb(var(--signal))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={C}
              animate={{ strokeDashoffset: C * (1 - Math.min(1, Math.max(0, progress))) }}
              transition={{ duration: 0.9, ease: "linear" }}
              
            />
          </svg>
          <div className="text-center">
            <motion.p
              key={running ? "run" : "pause"}
              initial={{ opacity: 0.4 }}
              animate={running ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
              transition={running ? { duration: 0.2 } : { duration: 1.4, repeat: Infinity }}
              className="t-display tabular text-[64px] leading-none text-ink"
            >
              {time}
            </motion.p>
            <p className="t-label mt-3">{running ? (countdown ? "Remaining" : "Elapsed") : "Paused"}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="w-full rounded-card border border-line bg-surface/80 p-4 backdrop-blur">
          {children}
        </motion.div>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={onToggle}
          aria-label={running ? "Pause" : "Resume"}
          className="btn-ghost h-14 w-14 shrink-0 tracking-normal"
        >
          {running ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onFinish}
          className="flex h-14 flex-1 items-center justify-center gap-2 btn-primary"
        >
          <Check className="h-5 w-5" strokeWidth={2.75} /> Finish
        </motion.button>
      </div>
    </motion.div>
  );
}
