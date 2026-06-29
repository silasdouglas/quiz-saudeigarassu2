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

export async function addRandomQuestions(
  scheduleId: string,
  count: number,
  targetRole: "all" | "tecnico" | "enfermeira" = "all"
): Promise<{ addedIds: string[] }> {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: currentScheduled }, { data: previouslyUsed }] = await Promise.all([
    supabase.from("schedule_questions").select("question_id").eq("schedule_id", scheduleId),
    supabase.from("schedule_questions").select("question_id").neq("schedule_id", scheduleId),
  ]);

  const currentIds = new Set((currentScheduled ?? []).map((r) => r.question_id));
  const previousIds = new Set((previouslyUsed ?? []).map((r) => r.question_id));

  let query = supabase.from("questions").select("id").eq("active", true);
  if (targetRole === "tecnico") {
    query = query.in("target_role", ["tecnico", "ambos"]);
  } else if (targetRole === "enfermeira") {
    query = query.in("target_role", ["enfermeira", "ambos"]);
  }
  const { data: allActive } = await query;

  const candidates = (allActive ?? [])
    .map((q) => q.id)
    .filter((id) => !currentIds.has(id) && !previousIds.has(id));

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const toAdd = candidates.slice(0, count);
  if (!toAdd.length) return { addedIds: [] };

  await supabase
    .from("schedule_questions")
    .insert(toAdd.map((question_id) => ({ schedule_id: scheduleId, question_id })));

  revalidatePath("/admin/questions");
  return { addedIds: toAdd };
}

export async function syncAllToSchedule(scheduleId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("schedule_questions")
    .select("question_id")
    .eq("schedule_id", scheduleId);

  const existingIds = new Set((existing ?? []).map((r) => r.question_id));

  const { data: allActive } = await supabase
    .from("questions")
    .select("id")
    .eq("active", true);

  const toAdd = (allActive ?? [])
    .map((q) => q.id)
    .filter((id) => !existingIds.has(id));

  if (!toAdd.length) return;

  await supabase
    .from("schedule_questions")
    .insert(toAdd.map((question_id) => ({ schedule_id: scheduleId, question_id })));

  revalidatePath("/admin/questions");
}
