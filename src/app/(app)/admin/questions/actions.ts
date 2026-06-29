"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Difficulty, Option } from "@/lib/types";

export type QuestionFormState = { error?: string } | undefined;

function parseQuestionForm(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  return {
    question_text: String(formData.get("question_text") ?? "").trim(),
    option_a: String(formData.get("option_a") ?? "").trim(),
    option_b: String(formData.get("option_b") ?? "").trim(),
    option_c: String(formData.get("option_c") ?? "").trim(),
    option_d: String(formData.get("option_d") ?? "").trim(),
    difficulty: String(formData.get("difficulty") ?? "facil") as Difficulty,
    correct_option: String(formData.get("correct_option") ?? "a") as Option,
    category_id: categoryId || null,
    time_limit_seconds: Number(formData.get("time_limit_seconds") ?? 60),
    active: formData.get("active") === "on",
    target_role: String(formData.get("target_role") ?? "ambos") as "tecnico" | "enfermeira" | "ambos",
  };
}

function validate(fields: ReturnType<typeof parseQuestionForm>) {
  if (
    !fields.question_text ||
    !fields.option_a ||
    !fields.option_b ||
    !fields.option_c ||
    !fields.option_d
  ) {
    return "Preencha a pergunta e as 4 alternativas.";
  }
  if (!fields.time_limit_seconds || fields.time_limit_seconds <= 0) {
    return "Tempo limite deve ser maior que zero.";
  }
  return null;
}

export async function createQuestion(
  _state: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  const admin = await requireAdmin();
  const fields = parseQuestionForm(formData);
  const validationError = validate(fields);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      question_text: fields.question_text,
      option_a: fields.option_a,
      option_b: fields.option_b,
      option_c: fields.option_c,
      option_d: fields.option_d,
      difficulty: fields.difficulty,
      category_id: fields.category_id,
      time_limit_seconds: fields.time_limit_seconds,
      active: fields.active,
      target_role: fields.target_role,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    return { error: questionError?.message ?? "Erro ao criar pergunta." };
  }

  const { error: answerError } = await supabase
    .from("question_answers")
    .insert({ question_id: question.id, correct_option: fields.correct_option });

  if (answerError) {
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: answerError.message };
  }

  revalidatePath("/admin/questions");
}

export async function updateQuestion(
  id: string,
  _state: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  await requireAdmin();
  const fields = parseQuestionForm(formData);
  const validationError = validate(fields);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error: questionError } = await supabase
    .from("questions")
    .update({
      question_text: fields.question_text,
      option_a: fields.option_a,
      option_b: fields.option_b,
      option_c: fields.option_c,
      option_d: fields.option_d,
      difficulty: fields.difficulty,
      category_id: fields.category_id,
      time_limit_seconds: fields.time_limit_seconds,
      active: fields.active,
      target_role: fields.target_role,
    })
    .eq("id", id);

  if (questionError) return { error: questionError.message };

  const { error: answerError } = await supabase
    .from("question_answers")
    .update({ correct_option: fields.correct_option })
    .eq("question_id", id);

  if (answerError) return { error: answerError.message };

  revalidatePath("/admin/questions");
}

export async function deleteQuestion(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", id);
  revalidatePath("/admin/questions");
}
