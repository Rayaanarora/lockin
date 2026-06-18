export interface User {
  id: number;
  name: string;
  college: string;
  college_id: string;
  department: string;
  reputation_score: number;
  location: string;
  bio?: string;
  instagram?: string;
  github?: string;
  interests?: string;
  campus_id?: number;
}

export interface Mission {
  id: number;
  creator_id: number;
  title: string;
  description: string;
  location: string;
  datetime: string;
  creator_name?: string;
  creator_department?: string;
  status?: string;
  showed_up?: boolean | null;
  role?: "creator" | "participant";
  participant_name?: string;
  participant_id?: number;
  participant_department?: string;
  participant_reputation?: number;
  verification_code?: string;
  category_name?: string;
  category_id?: number;
  mission_type?: string;
}

export interface Message {
  id: number;
  mission_id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender_name: string;
}
