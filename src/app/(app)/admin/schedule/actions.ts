"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function createSchedule(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const weekStart = String(formData.get("week_start") ?? "").trim();
  if (!weekStart) return;

  const supabase = await createClient();
  await supabase
    .from("weekly_schedules")
    .insert({ week_start: weekStart, created_by: admin.id });

  revalidatePath("/admin/schedule");
}

export async function addQuestion(
  scheduleId: string,
  questionId: string
): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_questions")
    .insert({ schedule_id: scheduleId, question_id: questionId });

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  return {};
}

export async function removeQuestion(
  scheduleId: string,
  questionId: string
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("schedule_questions")
    .delete()
    .eq("schedule_id", scheduleId)
    .eq("question_id", questionId);

  revalidatePath("/admin/schedule");
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("weekly_schedules").delete().eq("id", scheduleId);
  revalidatePath("/admin/schedule");
}
