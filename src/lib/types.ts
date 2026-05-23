// 研脉 · 核心类型定义

export type UserRole = "导师" | "博士" | "硕士" | "新生";
export type UserStatus = "在研" | "即将毕业" | "已毕业";
export type LensType = "mentor" | "senior" | "reviewer" | "cross";
export type Visibility = "private" | "group" | "alumni" | "public";
export type Confidence = "high" | "medium" | "low";
export type ChatMode = "think" | "debate";
export type AlertLevel = "danger" | "warning" | "success";

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  group_name: string;
  year: number;
  mastery: number;
  status: UserStatus;
  style_json: Record<string, unknown>;
}

export interface Paper {
  id: number;
  title: string;
  authors: string;
  journal: string;
  doi: string;
  abstract: string;
  sections_json: { heading: string; body: string }[];
  tags_json: string[];
  created_at: string;
}

export interface Annotation {
  id: number;
  paper_id: number;
  anchor_text: string;
  content: string;
  author: string;
  role: LensType;
  lens_type: LensType;
  has_think_prompt: number;
  think_question: string;
  visibility: Visibility;
  confidence: Confidence;
  confidence_note: string;
  created_at: string;
}

export interface Failure {
  id: number;
  title: string;
  experimenter: string;
  date: string;
  what: string;
  failure: string;
  why: string;
  lesson: string;
  tags_json: string[];
  people_count: number;
  scope: string;
  visibility: Visibility;
}

export interface ChatHistory {
  id: number;
  user_id: string;
  scene_id: number | null;
  question: string;
  answer: string;
  sources_json: { title: string; score: number; snippet: string }[];
  mode: ChatMode;
  created_at: string;
}

export interface Alert {
  id: number;
  level: AlertLevel;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface CapsuleAsset {
  id: number;
  user_id: string;
  category: string;
  label: string;
  count: number;
  created_at: string;
}

export interface LearningPath {
  id: number;
  user_id: string;
  week_number: number;
  paper_ids_json: number[];
  description: string;
  status: "pending" | "in_progress" | "completed";
}

export interface ChatScene {
  id: number;
  title: string;
  icon: string;
  mode: ChatMode;
  messages: { role: "user" | "ai"; content: string }[];
}

// RAG / AI Adapter types
export interface AskFirstResponse {
  response: string;
  scene_id: number | null;
  mode: "ask_first";
}

export interface FollowupResponse {
  response: string;
  mode: "show_experience" | "ask_deeper";
}

export interface SearchResult {
  title: string;
  score: number;
  snippet: string;
  chunk_id: string;
  author: string;
}
