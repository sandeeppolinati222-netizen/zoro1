export interface User {
  id: number;
  email: string;
  name: string;
  cgpa?: number;
  skills?: string;
  interests?: string;
}

export interface ReadinessScore {
  overall_score: number;
  resume_score: number;
  interview_score: number;
  coding_score: number;
  soft_skills_score: number;
}

export interface HistoryItem {
  id: number;
  type: string;
  score: number;
  feedback: string;
  created_at: string;
}

export type ModuleType = 
  | 'dashboard'
  | 'interview'
  | 'resume'
  | 'coding'
  | 'career'
  | 'soft_skills'
  | 'gd'
  | 'company'
  | 'learning'
  | 'doubt';
