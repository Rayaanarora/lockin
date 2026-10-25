export interface User {
  id: number;
  name: string;
  email?: string;
  email_verified?: boolean;
  college: string;
  college_id: number | string;
  department: string;
  reputation_score: number;
  location: string;
  bio?: string;
  instagram?: string;
  github?: string;
  interests?: string;
  campus_id?: number;
  campus_name?: string;
  verified_at?: string;
  avatar_url?: string | null;
}

export interface Mission {
  id: number;
  creator_id?: number | null;
  title: string;
  description: string;
  location: string;
  datetime?: string | null;
  creator_name?: string | null;
  creator_department?: string | null;
  is_system?: boolean;
  status?: string;
  showed_up?: boolean | null;
  role?: "creator" | "participant";
  participant_name?: string;
  participant_id?: number;
  creator_vibe_rating?: "W" | "L" | null;
  participant_vibe_rating?: "W" | "L" | null;
  participant_department?: string;
  participant_reputation?: number;
  verification_code?: string;
  category_name?: string;
  category_id?: number;
  category_emoji?: string;
  category_color?: string;
  mission_type?: string;
  focus_duration?: number;
  cover_color?: string | null;
  cover_image?: string | null;
  is_event?: boolean;
  require_approval?: boolean;
  registration_q?: string | null;
  secret_info?: string | null;
  max_capacity?: number | null;
  application_note?: string | null;
  roster?: {
    pending: Array<{
      id: number;
      participant_id: number;
      user_id?: number;
      name: string;
      department?: string;
      reputation_score?: number;
      reputation_points?: number;
      avatar_url?: string | null;
      status?: string;
      showed_up?: boolean | null;
      application_note?: string | null;
    }>;
    going: Array<{
      id: number;
      participant_id: number;
      user_id?: number;
      name: string;
      department?: string;
      reputation_score?: number;
      reputation_points?: number;
      avatar_url?: string | null;
      status?: string;
      showed_up?: boolean | null;
      application_note?: string | null;
    }>;
    checkedIn?: Array<{
      id: number;
      participant_id: number;
      user_id?: number;
      name: string;
      department?: string;
      reputation_score?: number;
      reputation_points?: number;
      avatar_url?: string | null;
      status?: string;
      showed_up?: boolean | null;
      application_note?: string | null;
    }>;
    all?: Array<{
      id: number;
      participant_id: number;
      user_id?: number;
      name: string;
      department?: string;
      reputation_score?: number;
      reputation_points?: number;
      avatar_url?: string | null;
      status?: string;
      showed_up?: boolean | null;
      application_note?: string | null;
    }>;
  };
  locked_in_count?: number;
  attendees?: Array<{
    id: number;
    name: string;
    department: string;
    reputation_score: number;
    is_host: boolean;
    status?: string;
    showed_up?: boolean | null;
    application_note?: string | null;
  }>;
}

export interface Message {
  id: number;
  mission_id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender_name: string;
}

export interface InterestCategory {
  id: number;
  name: string;
  emoji: string | null;
  color: string;
}

export interface Post {
  id: number;
  userId: number;
  recapId?: number | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  caption?: string | null;
  visibility: "college" | "followers" | "everyone";
  createdAt: string;
  user: {
    id: number;
    name: string;
    department: string;
    college: string;
    reputationScore: number;
    avatarUrl?: string | null;
  };
  recap?: {
    id: number;
    sessionDuration: number;
    tasksCompleted: number;
    streak: number;
    categorySnapshot: string;
    missionTitle: string;
    generatedAt: string;
  } | null;
  commentCount: number;
  reactionCounts: {
    "🔥": number;
    "💀": number;
    "❤️": number;
    "🧠": number;
  };
  userReactions: {
    "🔥": boolean;
    "💀": boolean;
    "❤️": boolean;
    "🧠": boolean;
  };
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  text: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    department: string;
  };
}

