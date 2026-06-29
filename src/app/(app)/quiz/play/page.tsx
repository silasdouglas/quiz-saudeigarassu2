import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import type { Difficulty } from "@/lib/types";
import { computeWeekStart } from "@/lib/week";

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  facil: 0,
  media: 1,
  dificil: 2,
};

export default async function QuizPlayPage() {
  const profile = await requireUser();
  const supabase = await createClient();
  const weekStart = computeWeekStart();

  // attempt + schedule + settings all in parallel
  const [attemptResult, scheduleResult, settingsResult] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("id, status, total_score, tab_switch_count")
      .eq("user_id", profile.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("weekly_schedules")
      .select("id")
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("quiz_settings")
      .select("tab_switch_penalty_points, max_tab_switches")
      .single(),
  ]);

  const attempt = attemptResult.data;
  const schedule = scheduleResult.data;

  if (!attempt || attempt.status !== "in_progress") {
    redirect("/quiz");
  }

  if (!schedule) {
    redirect("/quiz");
  }

  const { data: rows } = await supabase
    .from("schedule_questions")
    .select(
      "questions(id, question_text, option_a, option_b, option_c, option_d, difficulty, points, time_limit_seconds, target_role, categories(name))"
    )
    .eq("schedule_id", schedule.id);

  type QuestionRow = {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    difficulty: Difficulty;
    points: number;
    time_limit_seconds: number;
    target_role?: string;
    category_name?: string;
  };

  type RawQuestion = QuestionRow & { categories?: { name: string } | null };

  const allQuestions = (rows ?? [])
    .map((row) => {
      const q = row.questions as unknown as RawQuestion | null;
      if (!q) return null;
      return {
        id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        difficulty: q.difficulty,
        points: q.points,
        time_limit_seconds: q.time_limit_seconds,
        target_role: q.target_role ?? undefined,
        category_name: q.categories?.name ?? undefined,
      } as QuestionRow;
    })
    .filter((q): q is QuestionRow => q !== null)
    // Admins answer questions of every função; regular users only get questions
    // targeted at their função (or "ambos").
    .filter(
      (q) =>
        profile.role === "admin" ||
        !q.target_role ||
        q.target_role === "ambos" ||
        !profile.funcao ||
        q.target_role === profile.funcao
    )
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

  const { data: answered } = await supabase
    .from("attempt_answers")
    .select("question_id")
    .eq("attempt_id", attempt.id);

  const answeredIds = new Set((answered ?? []).map((a) => a.question_id));
  const pendingQuestions = allQuestions.filter((q) => !answeredIds.has(q.id));

  const settings = settingsResult.data;

  if (pendingQuestions.length === 0) {
    redirect("/quiz");
  }

  return (
    <QuizRunner
      attemptId={attempt.id}
      questions={pendingQuestions}
      totalQuestionCount={allQuestions.length}
      initialScore={attempt.total_score}
      initialTabSwitches={attempt.tab_switch_count}
      maxTabSwitches={settings?.max_tab_switches ?? 3}
    />
  );
}
