"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Star,
  Trophy,
  Search,
  AlertTriangle,
  Check,
  Instagram,
  Github,
  MapPin,
  Mail,
  KeyRound,
  X,
  Sparkles,
  Compass,
  Timer,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { User, InterestCategory } from "../app/types";
import { LockinLogo, LockinMark } from "./ui/LockinLogo";
import { spring, stagger, rise } from "../lib/motion";

import { supabase } from "../lib/supabase";
import { DEMO_LOGIN_ENABLED, clearDemoSession, isDemoSession } from "../lib/api";
import { POINTS_NAME } from "../lib/brand";

interface ProfileGateProps {
  onReady: (user: User) => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

interface Campus {
  id: number;
  name: string;
  location?: string;
}

const TUTORIAL_STEPS = [
  {
    icon: Compass,
    title: "Pick a mission",
    body: "Swipe through what people on your campus are doing right now. Lock in to one, or launch your own and let others join you."
  },
  {
    icon: Users,
    title: "Show up in person",
    body: "Group missions have a place and a time. When you arrive, the host gives you a 4-digit code to check in."
  },
  {
    icon: Timer,
    title: "Do the work",
    body: "The timer runs, you clear your checklist. Bail early with nothing done and it shows on your record."
  },
  {
    icon: Trophy,
    title: `Build your ${POINTS_NAME}`,
    body: `Every finished mission adds to your ${POINTS_NAME} and your streak. It's a record of showing up, not of talking about it.`
  }
];

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0, filter: "blur(4px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0, filter: "blur(4px)", transition: { duration: 0.18 } })
};

export default function ProfileGate({ onReady, api }: ProfileGateProps) {
  const [step, setStep] = useState(0); // 0=splash, 1=campus, 2=profile, 3=socials, 4=tutorial
  const [direction, setDirection] = useState(1);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusSearch, setCampusSearch] = useState("");
  const [showCampusList, setShowCampusList] = useState(false);
  const [tutorialSlide, setTutorialSlide] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [interestCategories, setInterestCategories] = useState<InterestCategory[]>([]);
  const [devOtp, setDevOtp] = useState("");
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  const [form, setForm] = useState({
    email: "",
    password: "",
    otpCode: "",
    campusId: "" as string | number,
    campusName: "",
    college_id: "",
    department: "",
    name: "",
    bio: "",
    location: "",
    instagram: "",
    github: "",
    interests: [] as string[],
  });

  const [validation, setValidation] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDemoSession()) {
        const demoUserStr = localStorage.getItem("lockin_demo_user");
        if (demoUserStr) {
          try {
            const parsed = JSON.parse(demoUserStr);
            if (parsed && parsed.id) {
              onReady(parsed);
              return;
            }
          } catch (e) {}
        }
      }
      const savedEmail = localStorage.getItem("lockin_saved_email");
      if (savedEmail) {
        setForm((f) => ({ ...f, email: savedEmail }));
      }
    }
  }, [onReady]);

  useEffect(() => {
    api("/missions/campuses")
      .then((data: Campus[]) => setCampuses(data))
      .catch(() => {
        setCampuses([
          { id: 1, name: "SRM IST, Kattankulathur (KTR)", location: "Chennai, TN" },
          { id: 2, name: "SRM IST, Ramapuram", location: "Chennai, TN" },
          { id: 3, name: "IIT Madras", location: "Chennai, TN" },
          { id: 4, name: "VIT Vellore", location: "Vellore, TN" },
          { id: 5, name: "BITS Pilani", location: "Rajasthan" },
          { id: 6, name: "IIIT Hyderabad", location: "Hyderabad, TG" },
          { id: 7, name: "DTU Delhi", location: "Delhi" },
          { id: 8, name: "Manipal Institute of Technology", location: "Manipal, KA" },
        ]);
      });

    api("/interests/categories")
      .then((data: InterestCategory[]) => setInterestCategories(data))
      .catch(() => {
        setInterestCategories([
          { id: 1, name: "Coding", emoji: null, color: "#3b82f6" },
          { id: 2, name: "AI", emoji: null, color: "#8b5cf6" },
          { id: 3, name: "Startups", emoji: null, color: "#f59e0b" },
          { id: 4, name: "Hackathons", emoji: null, color: "#ef4444" },
          { id: 5, name: "Open Source", emoji: null, color: "#10b981" },
          { id: 6, name: "Design", emoji: null, color: "#ec4899" },
          { id: 7, name: "Content Creation", emoji: null, color: "#f97316" },
          { id: 8, name: "Fitness", emoji: null, color: "#14b8a6" },
          { id: 9, name: "Study Sessions", emoji: null, color: "#6366f1" },
          { id: 10, name: "Research", emoji: null, color: "#0ea5e9" },
          { id: 11, name: "Placements", emoji: null, color: "#e11d48" },
          { id: 12, name: "Competitive Programming", emoji: null, color: "#eab308" },
          { id: 13, name: "Reading", emoji: null, color: "#a855f7" },
          { id: 14, name: "Languages", emoji: null, color: "#06b6d4" },
          { id: 15, name: "Career", emoji: null, color: "#64748b" },
          { id: 16, name: "Projects", emoji: null, color: "#f43f5e" },
          { id: 17, name: "Networking", emoji: null, color: "#22c55e" },
          { id: 18, name: "Events", emoji: null, color: "#d946ef" },
          { id: 19, name: "Other", emoji: null, color: "#a1a1aa" }
        ]);
      });
  }, []);

  // Arriving from an expired reset link (/?forgot=1): open straight on "Forgot it?".
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("forgot") !== "1") return;
    setMode("forgot");
    setStep(1);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Detect email-verification redirect: Supabase fires SIGNED_IN after the
  // user clicks the confirmation link, which reloads the page and loses
  // React state (tempUserId). Recover by calling /api/auth/profile here.
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // If there is already a tempUserId (in-memory session), nothing to do.
        if (tempUserId) return;
        // Also skip if the user is already fully onboarded — page.tsx handles that.
        try {
          const syncRes = await api("/auth/profile", { method: "POST" });
          if (syncRes?.user) {
            const isIncomplete = !syncRes.user.department || !syncRes.user.college;
            if (isIncomplete) {
              setTempUserId(syncRes.user.id);
              setForm(f => ({
                ...f,
                campusId: "",
                campusName: "",
                name: syncRes.user.name || f.name,
              }));
              setDirection(1);
              setStep(3);
            }
            // If complete, page.tsx's own auth listener will call onReady.
          }
        } catch (e) {
          console.warn("[ProfileGate] Could not sync profile on SIGNED_IN:", e);
        }
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempUserId]);

  const filteredCampuses = campusSearch.trim()
    ? campuses.filter((c) =>
        c.name.toLowerCase().includes(campusSearch.toLowerCase()) ||
        (c.location || "").toLowerCase().includes(campusSearch.toLowerCase())
      )
    : campuses;

  async function handleAuthSubmit() {
    if (!form.email || !form.email.includes("@")) {
      setValidation({ email: "Valid student email is required." });
      return;
    }
    if (mode !== "forgot" && (!form.password || form.password.length < 6)) {
      setValidation({ password: "Password must be at least 6 characters." });
      return;
    }

    setBusy(true);
    setError("");
    setValidation({});

    try {
      // 1. Verify email domain matches a supported college
      const checkRes = await api(`/auth/check-domain?email=${encodeURIComponent(form.email)}`);
      if (!checkRes.success) {
        setError(checkRes.error || "Domain not supported.");
        setBusy(false);
        return;
      }

      // Remember verified email for future logins
      if (typeof window !== "undefined") {
        localStorage.setItem("lockin_saved_email", form.email);
      }

      const matchedCollege = checkRes.college;
      const matchedCampuses = checkRes.campuses;
      if (matchedCampuses && matchedCampuses.length > 0) {
        // /auth/check-domain returns { id, name (short), full_name, city }.
        setCampuses(matchedCampuses.map((c: any) => ({
          id: c.id,
          name: c.name && c.full_name ? `${c.name} (${c.full_name})` : c.full_name || c.name || "Campus",
          location: c.city || undefined
        })));
      }

      const defaultCampusId = matchedCollege ? matchedCollege.id : "";
      const defaultCampusName = matchedCollege
        ? (matchedCollege.name && matchedCollege.full_name
            ? `${matchedCollege.name} (${matchedCollege.full_name})`
            : matchedCollege.full_name || matchedCollege.name || "")
        : "";

      if (!supabase) throw new Error("Supabase is not initialized.");

      if (mode === "signup") {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (signUpErr) throw signUpErr;

        if (data.user && !data.session) {
          // Verification link sent
          setStep(2);
        } else if (data.session) {
          const syncRes = await api("/auth/profile", {
            method: "POST"
          });
          const isIncomplete = !syncRes.user.department || !syncRes.user.college;
          if (isIncomplete) {
            setTempUserId(syncRes.user.id);
            setForm(f => ({
              ...f,
              campusId: defaultCampusId,
              campusName: defaultCampusName,
              college_id: String(defaultCampusId || ""),
              name: syncRes.user.name || f.name
            }));
            setDirection(1);
            setStep(3);
          } else {
            localStorage.setItem("lockin_user_id", String(syncRes.user.id));
            onReady(syncRes.user);
          }
        }
      } else if (mode === "login") {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (signInErr) throw signInErr;

        if (data.session) {
          const syncRes = await api("/auth/profile", {
            method: "POST"
          });
          const isIncomplete = !syncRes.user.department || !syncRes.user.college;
          if (isIncomplete) {
            setTempUserId(syncRes.user.id);
            setForm(f => ({
              ...f,
              campusId: defaultCampusId || syncRes.user.collegeId || "",
              campusName: defaultCampusName || syncRes.user.college || "",
              college_id: String(defaultCampusId || syncRes.user.collegeId || ""),
              name: syncRes.user.name || f.name
            }));
            setDirection(1);
            setStep(3);
          } else {
            localStorage.setItem("lockin_user_id", String(syncRes.user.id));
            onReady(syncRes.user);
          }
        }
      } else if (mode === "forgot") {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetErr) throw resetErr;

        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "Authentication operation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    if (step === 1) {
      await handleAuthSubmit();
      return;
    }
    if (step === 2) {
      setMode("login");
      setStep(1);
      return;
    }
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((s) => s + 1);
    setError("");
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
    setError("");
    setValidation({});
  }

  function validateStep(s: number) {
    const errs: { [key: string]: string } = {};
    if (s === 3) {
      if (!form.campusId && form.campusName.trim().length < 3)
        errs.campusId = "Select a campus or type your college name (min 3 chars).";
      const reg = form.college_id.trim().toUpperCase();
      if (!reg || reg.length < 6) errs.college_id = "Enter your college student ID/roll number.";
      if (form.department.trim().length < 2) errs.department = "Enter your department & year.";
    }
    if (s === 4) {
      if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    }
    setValidation(errs);
    return Object.keys(errs).length === 0;
  }

  function toggleInterest(id: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(id)
        ? f.interests.filter((i) => i !== id)
        : [...f.interests, id],
    }));
  }

  async function submit() {
    let resolvedUserId = tempUserId;

    // If tempUserId was lost (e.g. page reload after email verification),
    // try to recover it from the active Supabase session.
    if (!resolvedUserId && supabase) {
      try {
        const syncRes = await api("/auth/profile", { method: "POST" });
        if (syncRes?.user?.id) {
          resolvedUserId = syncRes.user.id;
          setTempUserId(resolvedUserId);
        }
      } catch (e) {
        console.warn("[submit] Could not recover userId:", e);
      }
    }

    if (!resolvedUserId) {
      setError("Session expired. Please log in again.");
      setStep(1);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const college = form.campusName || "Campus";
      const interestsStr = form.interests
        .map((id) => {
          const cat = interestCategories.find((c) => String(c.id) === id);
          return cat ? cat.name : id;
        })
        .join(", ");

      const user = await api(`/users/${resolvedUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          college: college,
          collegeId: form.campusId ? Number(form.campusId) : null,
          department: form.department.trim(),
          bio: form.bio.trim(),
          instagram: form.instagram.trim(),
          github: form.github.trim(),
          interests: interestsStr,
          location: form.location,
        }),
      });

      try {
        await api("/interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            categoryIds: form.interests.map(Number)
          })
        });
      } catch (interestErr) {
        console.error("Failed to save relational interests:", interestErr);
      }

      localStorage.setItem("lockin_user_id", String(user.id));
      onReady(user);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
      setBusy(false);
    }
  }

  async function handleDemoLogin() {
    setBusy(true);
    setError("");
    try {
      // The server only answers when demo login is enabled for local development.
      localStorage.setItem("lockin_demo_active", "true");
      const demoUser = await api("/auth/demo");
      localStorage.setItem("lockin_demo_user", JSON.stringify(demoUser));
      onReady(demoUser);
    } catch (err: any) {
      clearDemoSession();
      setError(err?.message || "Demo login is not available.");
    } finally {
      setBusy(false);
    }
  }


  const STEP_KEYS = ["splash", "email", "otp", "campus", "profile", "socials", "tutorial"];

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center overflow-y-auto bg-bg px-5 py-8 md:justify-center">
      <div className="grid-noise pointer-events-none fixed inset-0" />
      <motion.div
        className="race-stripe pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="relative z-10 mx-auto my-auto w-full max-w-sm">
        {/* Onboarding progress (steps 3-5) */}
        {step >= 3 && step <= 5 && (
          <div className="mb-8 flex items-center gap-3">
            <BackButton onClick={goBack} />
            <div className="flex flex-1 gap-1.5" aria-label={`Step ${step - 2} of 3`}>
              {[3, 4, 5].map((s) => (
                <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                  <motion.div
                    className="h-full rounded-full bg-signal"
                    initial={false}
                    animate={{ width: step >= s ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              ))}
            </div>
            <span className="t-label tabular">{step - 2}/3</span>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="mb-8 flex items-center gap-3">
            <BackButton onClick={goBack} />
            <LockinLogo size="sm" />
          </div>
        )}

        <AnimatePresence>
          {error && step !== 6 && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <motion.div
                animate={{ x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-signal/70 bg-surface p-3.5 text-subhead text-ink"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
                <span>{error}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={STEP_KEYS[step]}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <SplashStep
                onLogin={() => { setMode("login"); goNext(); }}
                onSignup={() => { setMode("signup"); goNext(); }}
                onDemoLogin={DEMO_LOGIN_ENABLED ? handleDemoLogin : undefined}
                busy={busy}
              />
            )}
            {step === 1 && (
              <EmailStep form={form} setForm={setForm} validation={validation} onNext={goNext} busy={busy} mode={mode} setMode={setMode} onDemoLogin={DEMO_LOGIN_ENABLED ? handleDemoLogin : undefined} />
            )}
            {step === 2 && <OtpStep form={form} onNext={goNext} busy={busy} mode={mode} setMode={setMode} />}
            {step === 3 && (
              <CampusStep
                form={form}
                setForm={setForm}
                validation={validation}
                campuses={filteredCampuses}
                campusSearch={campusSearch}
                setCampusSearch={setCampusSearch}
                showCampusList={showCampusList}
                setShowCampusList={setShowCampusList}
                onNext={goNext}
              />
            )}
            {step === 4 && <ProfileStep form={form} setForm={setForm} validation={validation} onNext={goNext} />}
            {step === 5 && (
              <SocialsStep form={form} setForm={setForm} toggleInterest={toggleInterest} onNext={goNext} interestCategories={interestCategories} />
            )}
            {step === 6 && (
              <TutorialStep tutorialSlide={tutorialSlide} setTutorialSlide={setTutorialSlide} onBack={goBack} onSubmit={submit} busy={busy} error={error} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── SPLASH ─────────────────────────────────────────────────────── */
function SplashStep({
  onLogin,
  onSignup,
  onDemoLogin,
  busy
}: {
  onLogin: () => void;
  onSignup: () => void;
  onDemoLogin?: () => void;
  busy?: boolean;
}) {
  const loop = [
    { n: "01", title: "Discover", desc: "See what people on your campus are about to do." },
    { n: "02", title: "Lock in", desc: "Commit to a mission, solo or with others." },
    { n: "03", title: "Show up", desc: `Check in, do the work, build your ${POINTS_NAME}.` }
  ];

  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <LockinLogo layout="stacked" size="lg" animate />

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="t-display mt-10 text-large-title text-ink"
      >
        Stop chatting.
        <br />
        <span className="text-crimson">Start showing up.</span>
      </motion.h1>

      <motion.ol
        variants={stagger(0.09, 1.85)}
        initial="hidden"
        animate="show"
        className="mt-10 w-full space-y-px overflow-hidden rounded-2xl border border-line text-left"
      >
        {loop.map((item) => (
          <motion.li key={item.n} variants={rise} className="flex items-center gap-4 bg-surface px-4 py-4">
            <span className="t-display tabular text-title-2 text-crimson">{item.n}</span>
            <div className="min-w-0">
              <p className="text-headline text-ink">{item.title}</p>
              <p className="text-subhead leading-snug text-ink-2">{item.desc}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.25, ...spring.glide }}
        className="mt-8 w-full space-y-3"
      >
        <PrimaryButton onClick={onSignup}>
          Get started <ChevronRight className="h-5 w-5" />
        </PrimaryButton>
        <button
          type="button"
          onClick={onLogin}
          className="flex h-14 w-full items-center justify-center btn-ghost"
        >
          I have an account
        </button>
        {onDemoLogin && (
          <button
            type="button"
            disabled={busy}
            onClick={onDemoLogin}
            className="h-11 w-full text-subhead text-ink-3 underline-offset-4 transition-colors hover:text-ink-2 hover:underline disabled:opacity-50"
          >
            Try the demo account
          </button>
        )}
      </motion.div>

      <p className="mt-4 text-footnote text-ink-3">College email required.</p>
    </div>
  );
}

/* ─── CAMPUS ─────────────────────────────────────────────────────── */
function CampusStep({ form, setForm, validation, campuses, campusSearch, setCampusSearch, showCampusList, setShowCampusList, onNext }: any) {
  return (
    <div className="space-y-7">
      <StepHeading eyebrow="Your campus" title="Where do you show up?" sub="Your feed only shows missions from your college." />

      <div className="space-y-5">
        <FormField label="College" error={validation.campusId}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCampusList(!showCampusList)}
              aria-expanded={showCampusList}
              className={`flex h-12 w-full items-center gap-3 rounded-xl border bg-raised px-3.5 text-left transition-colors ${
                validation.campusId ? "border-signal" : form.campusId ? "border-ink-3/60" : "border-line hover:border-ink-3/40"
              }`}
            >
              <Search className="h-4 w-4 shrink-0 text-ink-3" />
              <span className={`flex-1 truncate text-callout ${form.campusName ? "text-ink" : "text-ink-3"}`}>
                {form.campusName || "Search your college"}
              </span>
              {form.campusName && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear college"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((f: any) => ({ ...f, campusId: "", campusName: "" }));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-overlay hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </span>
              )}
              <motion.span animate={{ rotate: showCampusList ? 90 : 0 }} transition={spring.snap}>
                <ChevronRight className="h-4 w-4 text-ink-3" />
              </motion.span>
            </button>

            <AnimatePresence>
              {showCampusList && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
                  transition={spring.glide}
                  style={{ transformOrigin: "top" }}
                  className="absolute left-0 right-0 top-[56px] z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
                >
                  <div className="border-b border-line p-2">
                    <input
                      autoFocus
                      value={campusSearch}
                      onChange={(e) => setCampusSearch(e.target.value)}
                      placeholder="Type to filter"
                      aria-label="Filter colleges"
                      className="h-11 w-full rounded-lg bg-raised px-3 text-callout text-ink outline-none placeholder:text-ink-3"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {campuses.length === 0 && <p className="p-4 text-center text-subhead text-ink-3">No colleges match that.</p>}
                    {campuses.map((c: Campus) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setForm((f: any) => ({ ...f, campusId: c.id, campusName: c.name }));
                          setShowCampusList(false);
                          setCampusSearch("");
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raised"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                        <span>
                          <span className="block text-subhead font-medium text-ink">{c.name}</span>
                          {c.location && <span className="block text-footnote text-ink-3">{c.location}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FormField>

        {!form.campusId && (
          <FormField label="Not listed? Type it" hint="Spell it exactly. This is how people from your college find you." htmlFor="g-college">
            <Input
              id="g-college"
              value={form.campusName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, campusName: e.target.value }))}
              placeholder="VIT Bhopal"
            />
          </FormField>
        )}

        <FormField label="Registration number" error={validation.college_id} htmlFor="g-reg">
          <Input
            id="g-reg"
            value={form.college_id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, college_id: e.target.value }))}
            placeholder="RA2211003010123"
            aria-invalid={!!validation.college_id}
            className="uppercase"
          />
        </FormField>

        <FormField label="Department and year" error={validation.department} htmlFor="g-dept">
          <Input
            id="g-dept"
            value={form.department}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, department: e.target.value }))}
            placeholder="CSE, 3rd year"
            aria-invalid={!!validation.department}
          />
        </FormField>
      </div>

      <PrimaryButton onClick={onNext}>
        Continue <ChevronRight className="h-5 w-5" />
      </PrimaryButton>
    </div>
  );
}

/* ─── PROFILE ────────────────────────────────────────────────────── */
function ProfileStep({ form, setForm, validation, onNext }: any) {
  const over = form.bio.length > 140;
  return (
    <div className="space-y-7">
      <StepHeading eyebrow="About you" title="Who's showing up?" sub="This is what people see before they lock in with you." />

      <div className="space-y-5">
        <FormField label="Name" error={validation.name} htmlFor="g-name">
          <Input
            id="g-name"
            autoComplete="name"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, name: e.target.value }))}
            placeholder="Your name"
            aria-invalid={!!validation.name}
          />
        </FormField>

        <FormField
          label="Short bio"
          htmlFor="g-bio"
          trailing={<span className={`tabular text-footnote ${over ? "text-crimson" : "text-ink-3"}`}>{form.bio.length}/150</span>}
        >
          <Textarea
            id="g-bio"
            value={form.bio}
            onChange={(e) => setForm((f: any) => ({ ...f, bio: e.target.value.slice(0, 150) }))}
            placeholder="What are you working on?"
            rows={3}
          />
        </FormField>

        <FormField label="Usual spot on campus" htmlFor="g-spot" icon={<MapPin className="h-3.5 w-3.5" />}>
          <Input
            id="g-spot"
            value={form.location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, location: e.target.value }))}
            placeholder="Main library"
          />
        </FormField>
      </div>

      <PrimaryButton onClick={onNext}>
        Continue <ChevronRight className="h-5 w-5" />
      </PrimaryButton>
    </div>
  );
}

/* ─── SOCIALS & INTERESTS ────────────────────────────────────────── */
function SocialsStep({ form, setForm, toggleInterest, onNext, interestCategories }: any) {
  return (
    <div className="space-y-7">
      <StepHeading eyebrow="Interests" title="What do you lock in on?" sub="Optional, but it helps the right missions find you." />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Instagram" htmlFor="g-ig" icon={<Instagram className="h-3.5 w-3.5" />}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-callout text-ink-3">@</span>
              <Input id="g-ig" value={form.instagram} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, instagram: e.target.value.replace("@", "") }))} placeholder="handle" className="pl-8" />
            </div>
          </FormField>
          <FormField label="GitHub" htmlFor="g-gh" icon={<Github className="h-3.5 w-3.5" />}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-callout text-ink-3">@</span>
              <Input id="g-gh" value={form.github} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, github: e.target.value.replace("@", "") }))} placeholder="handle" className="pl-8" />
            </div>
          </FormField>
        </div>

        <div className="space-y-3">
          <p className="t-label">Pick any</p>
          <motion.div variants={stagger(0.03)} initial="hidden" animate="show" className="flex flex-wrap gap-2">
            {interestCategories.map((cat: any) => {
              const selected = form.interests.includes(String(cat.id));
              return (
                <motion.button
                  key={cat.id}
                  variants={rise}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleInterest(String(cat.id))}
                  aria-pressed={selected}
                  className={`flex h-10 items-center gap-1.5 rounded-sm border px-4 text-subhead font-medium transition-colors ${
                    selected ? "border-signal bg-surface text-ink" : "border-line bg-surface text-ink-2 hover:border-ink-3/40 hover:text-ink"
                  }`}
                >
                  <AnimatePresence initial={false}>
                    {selected && (
                      <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex overflow-hidden">
                        <Check className="h-4 w-4 text-crimson" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {cat.name}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </div>

      <PrimaryButton onClick={onNext}>
        How it works <ChevronRight className="h-5 w-5" />
      </PrimaryButton>
    </div>
  );
}

/* ─── TUTORIAL ───────────────────────────────────────────────────── */
function TutorialStep({ tutorialSlide, setTutorialSlide, onBack, onSubmit, busy, error }: any) {
  const slide = TUTORIAL_STEPS[tutorialSlide];
  const Icon = slide.icon;
  const isLast = tutorialSlide === TUTORIAL_STEPS.length - 1;

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <BackButton onClick={onBack} />
        <div>
          <h2 className="t-display text-title-1 text-ink">The loop</h2>
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50 && !isLast) setTutorialSlide((s: number) => s + 1);
          if (info.offset.x > 50 && tutorialSlide > 0) setTutorialSlide((s: number) => s - 1);
        }}
        className="relative cursor-grab touch-pan-y overflow-hidden rounded-2xl border border-line bg-surface active:cursor-grabbing"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tutorialSlide}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[240px] space-y-5 p-6"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={spring.pop}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-signal/70 bg-surface"
            >
              <Icon className="h-7 w-7 text-crimson" />
            </motion.div>
            <div>
              <p className="t-label tabular">
                {String(tutorialSlide + 1).padStart(2, "0")} / {String(TUTORIAL_STEPS.length).padStart(2, "0")}
              </p>
              <h3 className="t-display mt-2 text-title-1 text-ink">{slide.title}</h3>
              <p className="mt-3 text-subhead leading-relaxed text-ink-2">{slide.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="relative flex justify-center gap-2 pb-5">
          {TUTORIAL_STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTutorialSlide(i)}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === tutorialSlide}
              className="flex h-11 w-8 items-center justify-center"
            >
              <motion.span
                className={`block h-1.5 rounded-full transition-colors duration-200 ${i === tutorialSlide ? "bg-signal" : "bg-line"}`}
                animate={{ width: i === tutorialSlide ? 28 : 8 }}
                transition={spring.glide}
              />
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 rounded-xl border border-signal/70 bg-surface p-3.5 text-subhead text-ink"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {isLast ? (
        <PrimaryButton onClick={onSubmit} disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockinMark size={22} color="currentColor" showTriangle={false} />}
          {busy ? "Setting you up" : "Lock in"}
        </PrimaryButton>
      ) : (
        <button
          type="button"
          onClick={() => setTutorialSlide((s: number) => s + 1)}
          className="flex h-14 w-full items-center justify-center gap-2 btn-ghost"
        >
          Next <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/* ─── EMAIL ──────────────────────────────────────────────────────── */
function EmailStep({ form, setForm, validation, onNext, busy, mode, setMode, onDemoLogin }: any) {
  const [showPw, setShowPw] = useState(false);
  const copy = {
    login: { eyebrow: "Log in", title: "Welcome back", sub: "Use the email and password you signed up with.", cta: "Log in" },
    signup: { eyebrow: "Create account", title: "Join your campus", sub: "Use your college email so we can put you in the right feed.", cta: "Create account" },
    forgot: { eyebrow: "Reset password", title: "Forgot it?", sub: "We'll email you a link to set a new one.", cta: "Send reset link" }
  }[mode as "login" | "signup" | "forgot"];

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}>
          <StepHeading eyebrow={copy.eyebrow} title={copy.title} sub={copy.sub} />
        </motion.div>
      </AnimatePresence>

      <div className="space-y-5">
        <FormField label="College email" error={validation.email} htmlFor="g-email" icon={<Mail className="h-3.5 w-3.5" />}>
          <Input
            id="g-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, email: e.target.value }))}
            placeholder="name@srmist.edu.in"
            aria-invalid={!!validation.email}
          />
        </FormField>

        <AnimatePresence initial={false}>
          {mode !== "forgot" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <FormField label="Password" error={validation.password} htmlFor="g-pw" icon={<KeyRound className="h-3.5 w-3.5" />}>
                <div className="relative">
                  <Input
                    id="g-pw"
                    type={showPw ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={form.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, password: e.target.value }))}
                    placeholder="At least 6 characters"
                    aria-invalid={!!validation.password}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 hover:text-ink"
                  >
                    {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </FormField>
              {mode === "login" && (
                <button type="button" onClick={() => setMode("forgot")} className="mt-2 h-10 text-subhead text-ink-3 transition-colors hover:text-ink">
                  Forgot password?
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PrimaryButton type="submit" disabled={busy || !form.email || (mode !== "forgot" && !form.password)}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {busy ? "One sec" : copy.cta}
      </PrimaryButton>

      <div className="space-y-1 text-center">
        {mode === "login" ? (
          <button type="button" onClick={() => setMode("signup")} className="h-11 text-subhead text-ink-2 transition-colors hover:text-ink">
            New here? <span className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">Create an account</span>
          </button>
        ) : (
          <button type="button" onClick={() => setMode("login")} className="h-11 text-subhead text-ink-2 transition-colors hover:text-ink">
            {mode === "signup" ? "Already have an account? " : ""}
            <span className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">Log in</span>
          </button>
        )}
        {onDemoLogin && (
          <button type="button" disabled={busy} onClick={onDemoLogin} className="block h-10 w-full text-subhead text-ink-3 transition-colors hover:text-ink-2 disabled:opacity-50">
            Try the demo account
          </button>
        )}
      </div>
    </form>
  );
}

/* ─── CHECK INBOX ────────────────────────────────────────────────── */
function OtpStep({ form, onNext, mode, setMode }: any) {
  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-signal/70"
              animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
              transition={{ duration: 2, delay: i, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={spring.pop}
            className="relative flex h-20 w-20 items-center justify-center rounded-full border border-signal/70 bg-surface"
          >
            <Mail className="h-8 w-8 text-crimson" />
          </motion.div>
        </div>
        <h2 className="t-display text-large-title text-ink">{mode === "forgot" ? "Link sent" : "Verify your email"}</h2>
        <p className="mx-auto mt-3 max-w-[300px] text-subhead leading-relaxed text-ink-2">
          {mode === "forgot" ? "If an account exists for " : "We sent a confirmation link to "}
          <span className="font-semibold text-ink">{form.email}</span>
          {mode === "forgot" ? ", a reset link is on its way. It expires in an hour." : ". Open it, then come back and log in."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setMode("login");
          onNext();
        }}
        className="flex h-14 w-full items-center justify-center btn-ghost"
      >
        Back to log in
      </button>
    </div>
  );
}

/* ─── SHARED ─────────────────────────────────────────────────────── */
function StepHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <p className="t-section">{eyebrow}</p>
      <h2 className="t-display mt-3 text-large-title text-ink">{title}</h2>
      {sub && <p className="mt-2 text-subhead leading-relaxed text-ink-2">{sub}</p>}
    </div>
  );
}

function FormField({
  label,
  hint,
  error,
  htmlFor,
  icon,
  trailing,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="t-label flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {trailing}
      </div>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-footnote font-medium text-crimson"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {error}
          </motion.p>
        ) : hint ? (
          <p className="text-footnote leading-snug text-ink-3">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={spring.snap}
      className="relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden btn-primary"
    >
      {children}
    </motion.button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      aria-label="Back"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-2 transition-colors hover:text-ink"
    >
      <ChevronLeft className="h-5 w-5" />
    </motion.button>
  );
}
