"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Difficulty, Option } from "@/lib/types";

export interface AdminAttemptRow {
  attempt_id: string;
  user_id: string;
  full_name: string;
  email: string;
  funcao: "tecnico" | "enfermeira" | null;
  role: "admin" | "user";
  week_start: string;
  status: "in_progress" | "completed";
  total_score: number;
  total_time_seconds: number;
  tab_switch_count: number;
  started_at: string;
  finished_at: string | null;
  answered_count: number;
  correct_count: number;
}

export async function fetchAdminAttemptsAction(): Promise<AdminAttemptRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_attempts");
  return (data ?? []) as AdminAttemptRow[];
}

export interface AttemptAnswerDetail {
  question_id: string;
  question_text: string;
  difficulty: Difficulty;
  category_name: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_option: Option | null;
  correct_option: Option;
  is_correct: boolean;
  points_awarded: number;
  time_taken_seconds: number;
}

export async function getAttemptAnswers(
  attemptId: string
): Promise<AttemptAnswerDetail[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_attempt_answers", {
    p_attempt_id: attemptId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as AttemptAnswerDetail[];
}

export async function resetAttempt(attemptId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reset_attempt", {
    p_attempt_id: attemptId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/attempts");
}
