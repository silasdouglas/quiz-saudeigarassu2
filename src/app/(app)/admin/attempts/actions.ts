"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Difficulty, Option } from "@/lib/types";

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
