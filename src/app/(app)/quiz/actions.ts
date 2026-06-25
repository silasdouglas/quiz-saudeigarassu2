"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Option } from "@/lib/types";

export async function startQuiz() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_weekly_attempt");
  if (error) throw new Error(error.message);
  redirect("/quiz/play");
}

export async function submitAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: Option | null,
  timeTakenSeconds: number
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_answer", {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected_option: selectedOption,
    p_time_taken_seconds: timeTakenSeconds,
  });
  if (error) throw new Error(error.message);
  return data?.[0] as {
    is_correct: boolean;
    points_awarded: number;
    total_score: number;
  };
}

export async function applyTabSwitchPenalty(attemptId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_tab_switch_penalty", {
    p_attempt_id: attemptId,
  });
  if (error) throw new Error(error.message);
  return data?.[0] as {
    tab_switch_count: number;
    total_score: number;
    limit_reached: boolean;
  };
}

export async function finishQuiz(attemptId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_attempt", {
    p_attempt_id: attemptId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/quiz");
  redirect("/quiz");
}
