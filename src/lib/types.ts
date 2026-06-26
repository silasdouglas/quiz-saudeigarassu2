export type Difficulty = "facil" | "media" | "dificil";
export type Option = "a" | "b" | "c" | "d";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  funcao?: 'tecnico_enfermagem' | 'enfermeira' | null;
  created_at: string;
  avatar_url?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Question {
  id: string;
  category_id: string | null;
  difficulty: Difficulty;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  points: number;
  time_limit_seconds: number;
  active: boolean;
  target_role?: 'tecnico_enfermagem' | 'enfermeira' | 'ambos';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionWithCategory extends Question {
  categories: { name: string } | null;
}

export interface QuestionAnswer {
  question_id: string;
  correct_option: Option;
}

export interface QuizSettings {
  default_time_limit_seconds: number;
  tab_switch_penalty_points: number;
  max_tab_switches: number;
}

export interface WeeklySchedule {
  id: string;
  week_start: string;
  created_by: string | null;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  week_start: string;
  started_at: string;
  finished_at: string | null;
  total_score: number;
  total_time_seconds: number;
  tab_switch_count: number;
  status: "in_progress" | "completed";
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: Option | null;
  is_correct: boolean;
  points_awarded: number;
  time_taken_seconds: number;
  created_at: string;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
};

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  facil: 5,
  media: 10,
  dificil: 15,
};
