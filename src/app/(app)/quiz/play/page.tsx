import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import type { Difficulty } from "@/lib/types";

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  facil: 0,
  media: 1,
  dificil: 2,
};

export default async function QuizPlayPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: weekStart } = await supabase.rpc("current_week_start");

  const { data: attempt } = weekStart
    ? await supabase
        .from("quiz_attempts")
        .select("id, status, total_score, tab_switch_count")
        .eq("user_id", profile.id)
        .eq("week_start", weekStart)
        .maybeSingle()
    : { data: null };

  if (!attempt || attempt.status !== "in_progress") {
    redirect("/quiz");
  }

  const { data: schedule } = await supabase
    .from("weekly_schedules")
    .select("id")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!schedule) {
    redirect("/quiz");
  }

  const { data: rows } = await supabase
    .from("schedule_questions")
    .select(
      "questions(id, question_text, option_a, option_b, option_c, option_d, difficulty, points, time_limit_seconds)"
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
  };

  const allQuestions = (rows ?? [])
    .map((row) => row.questions as unknown as QuestionRow | null)
    .filter((q): q is QuestionRow => q !== null)
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

  const { data: answered } = await supabase
    .from("attempt_answers")
    .select("question_id")
    .eq("attempt_id", attempt.id);

  const answeredIds = new Set((answered ?? []).map((a) => a.question_id));
  const pendingQuestions = allQuestions.filter((q) => !answeredIds.has(q.id));

  const { data: settings } = await supabase
    .from("quiz_settings")
    .select("tab_switch_penalty_points, max_tab_switches")
    .single();

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
      tabSwitchPenaltyPoints={settings?.tab_switch_penalty_points ?? 5}
      maxTabSwitches={settings?.max_tab_switches ?? 3}
    />
  );
}
