"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { User, Mission } from "../app/types";
import HeatMap from "./HeatMap";
import FollowListModal from "./FollowListModal";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Instagram, Github, UserPlus, UserMinus, MessageSquare, Zap, Clock, CheckCircle2, Calendar, ListTodo } from "lucide-react";
import { AuraAvatar } from "./ui/AuraAvatar";
import { CountUp, Reveal, Skeleton } from "./ui/motion";
import { spring } from "../lib/motion";
import { POINTS_NAME } from "../lib/brand";

interface PublicProfileProps {
  userId: number;
  viewerId: number;
  isOpen: boolean;
  onClose: () => void;
  api: (path: string, options?: RequestInit) => Promise<any>;
}

export default function PublicProfile({ userId, viewerId, isOpen, onClose, api }: PublicProfileProps) {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isFollowListOpen, setIsFollowListOpen] = useState(false);
  const [followListInitialTab, setFollowListInitialTab] = useState<"followers" | "following">("followers");
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<number | null>(null);
  const [isNestedProfileOpen, setIsNestedProfileOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    async function fetchPublicProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await api(`/users/${userId}/public?viewerId=${viewerId}`);
        setProfileData(data);
      } catch (err: any) {
        console.error("Error fetching public profile:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchPublicProfile();
  }, [userId, viewerId, isOpen]);

  const handleFollowAction = async () => {
    if (!profileData || actionLoading) return;
    setActionLoading(true);
    const isFollowing = profileData.isFollowing;

    try {
      if (isFollowing) {
        // Unfollow
        await api(`/follow?followerId=${viewerId}&followingId=${userId}`, {
          method: "DELETE",
        });
        setProfileData((prev: any) => ({
          ...prev,
          isFollowing: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
      } else {
        // Follow
        await api("/follow", {
          method: "POST",
          body: JSON.stringify({ followerId: viewerId, followingId: userId }),
        });
        setProfileData((prev: any) => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1,
        }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update follow status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const u = profileData?.user;
  const initials = u?.name ? u.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase() : "??";
  const score = u?.reputation_score ?? 0;
  const tierProgress = score < 100 ? score / 100 : score < 250 ? (score - 100) / 150 : score < 500 ? (score - 250) / 250 : 1;
  const isSelf = u && u.id === viewerId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{u?.name || "Profile"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="grid w-full grid-cols-3 gap-2 pt-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          </div>
        ) : error || !profileData ? (
          <div className="py-16 text-center">
            <p className="t-display text-title-2 text-ink">Couldn&apos;t load this profile</p>
            <p className="mt-1 text-subhead text-ink-2">{error || "This person may have left."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero */}
            <div className="relative -mx-5 -mt-2 flex flex-col items-center px-5 pb-2 pt-4 text-center sm:-mx-6 sm:px-6">
              <AuraAvatar src={u.avatar_url} initials={initials} progress={tierProgress} size={104} />
              <h2 className="t-display relative mt-4 text-title-1 text-ink">{u.name}</h2>
              {u.username && <p className="relative mt-1 text-subhead text-ink-2">@{u.username}</p>}
              <p className="relative mt-1 text-subhead text-ink-3">
                {u.department}
                {u.college ? ` · ${u.college}` : ""}
              </p>
              {u.bio && <p className="relative mt-3 max-w-sm text-subhead leading-relaxed text-ink-2">{u.bio}</p>}

              <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="flex items-center gap-2 rounded-sm border border-gold/30 bg-gold/[0.08] py-1.5 pl-2 pr-3.5">
                  <CountUp value={score} className="font-display text-title-3 font-bold text-ink" />
                  <span className="text-micro font-semibold uppercase text-gold">{POINTS_NAME}</span>
                </span>
                {u.instagram && (
                  <a href={`https://instagram.com/${u.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {u.github && (
                  <a href={`https://github.com/${u.github}`} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink">
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div className="relative mt-5 flex w-full max-w-sm items-stretch gap-2">
                <div className="grid flex-1 grid-cols-2 divide-x divide-line rounded-xl border border-line">
                  {(
                    [
                      { tab: "followers", n: profileData.followersCount, label: "Followers" },
                      { tab: "following", n: profileData.followingCount, label: "Following" }
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.tab}
                      type="button"
                      onClick={() => {
                        setFollowListInitialTab(f.tab);
                        setIsFollowListOpen(true);
                      }}
                      className="flex flex-col items-center py-2.5 transition-colors hover:bg-raised"
                    >
                      <motion.span key={f.n} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="t-display text-title-2 text-ink">
                        {f.n}
                      </motion.span>
                      <span className="t-label">{f.label}</span>
                    </button>
                  ))}
                </div>
                {!isSelf && (
                  <motion.button
                    type="button"
                    onClick={handleFollowAction}
                    disabled={actionLoading}
                    whileTap={{ scale: 0.95 }}
                    transition={spring.snap}
                    className={`flex w-32 items-center justify-center gap-2 rounded-xl text-subhead font-semibold transition-colors disabled:opacity-60 ${
                      profileData.isFollowing ? "btn-ghost" : "btn-primary"
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={profileData.isFollowing ? "on" : "off"}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        {profileData.isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        {profileData.isFollowing ? "Following" : "Follow"}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                )}
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent("lockin:open-dm", { detail: { userId } }));
                    }}
                    aria-label={`Message ${u.name}`}
                    className="btn-ghost flex w-28 items-center justify-center gap-2 text-subhead"
                  >
                    <MessageSquare className="h-4 w-4" strokeWidth={1.5} /> Message
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <Reveal className="grid grid-cols-3 gap-2" each={0.04}>
              {[
                { label: "Missions", v: profileData.stats?.totalMissions ?? 0, s: "", icon: Flame },
                { label: "Hours", v: profileData.stats?.focusHours ?? 0, s: "h", icon: Clock },
                { label: "Completion", v: profileData.stats?.completionRate ?? 0, s: "%", icon: CheckCircle2 },
                { label: "Streak", v: profileData.stats?.currentStreak ?? 0, s: "d", icon: Zap },
                { label: "Tasks", v: profileData.stats?.tasksCompleted ?? 0, s: "", icon: ListTodo },
                { label: "Active days", v: profileData.stats?.activeDays ?? 0, s: "", icon: Calendar }
              ].map((st) => (
                <Reveal.Item key={st.label}>
                  <div className="rounded-xl border border-line bg-raised p-3.5">
                    <st.icon className="h-4 w-4 text-ink-3" />
                    <p className="t-display mt-3 text-title-1 leading-none text-ink">
                      <CountUp value={Number(st.v)} />
                      {st.s}
                    </p>
                    <p className="t-label mt-1.5">{st.label}</p>
                  </div>
                </Reveal.Item>
              ))}
            </Reveal>

            <HeatMap userId={userId} userJoinedAt={profileData?.user?.verified_at} api={api} />

            {/* Recent */}
            <div className="space-y-3">
              <p className="t-label">Recent sessions</p>
              {profileData.feedItems && profileData.feedItems.length > 0 ? (
                <Reveal className="space-y-2" each={0.04}>
                  {profileData.feedItems.map((item: any) => (
                    <Reveal.Item key={item.id}>
                      <div className="rounded-xl border border-line bg-raised p-4">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-subhead font-medium text-ink">{item.title}</span>
                          <span className="shrink-0 text-footnote text-ink-3">{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        {item.description && <p className="mt-1.5 text-subhead leading-relaxed text-ink-2">{item.description}</p>}
                        {item.metadata && (
                          <p className="mt-2 flex flex-wrap gap-x-3 text-footnote text-ink-3">
                            <span>{item.metadata.sessionDuration} min</span>
                            <span>{item.metadata.tasksCompleted || 0} tasks</span>
                            {item.metadata.category && <span className="text-crimson">{item.metadata.category}</span>}
                          </p>
                        )}
                      </div>
                    </Reveal.Item>
                  ))}
                </Reveal>
              ) : (
                <p className="rounded-xl border border-dashed border-line py-8 text-center text-subhead text-ink-3">No public sessions yet.</p>
              )}
            </div>

            <FollowListModal
              isOpen={isFollowListOpen}
              onClose={() => setIsFollowListOpen(false)}
              userId={userId}
              initialTab={followListInitialTab}
              onViewProfile={(profileId) => {
                setSelectedProfileUserId(profileId);
                setIsNestedProfileOpen(true);
              }}
              api={api}
            />

            {selectedProfileUserId && (
              <PublicProfile
                userId={selectedProfileUserId}
                viewerId={viewerId}
                isOpen={isNestedProfileOpen}
                onClose={() => {
                  setIsNestedProfileOpen(false);
                  setSelectedProfileUserId(null);
                }}
                api={api}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
