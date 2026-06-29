"use server";

import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { ChartDataPoint } from "@/components/admin/category-error-chart";

export interface AdminStats {
  userCount: number;
  questionCount: number;
  categoryCount: number;
  attemptsThisWeek: number;
  avgScore: number;
  chartData: ChartDataPoint[];
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday.toISOString().slice(0, 10);
}

export async function fetchAdminStatsAction(): Promise<AdminStats> {
  await requireAdmin();
  const supabase = await createClient();
  const weekStart = getWeekStart();

  const [
    { count: userCount },
    { count: questionCount },
    { count: categoryCount },
    { data: weekAttempts },
    { data: wrongAnswers },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user"),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase
      .from("quiz_attempts")
      .select("total_score")
      .eq("week_start", weekStart)
      .eq("status", "completed"),
    supabase
      .from("attempt_answers")
      .select("questions(categories(name))")
      .eq("is_correct", false)
      .limit(500),
  ]);

  const attemptsThisWeek = weekAttempts?.length ?? 0;
  const avgScore =
    weekAttempts && weekAttempts.length > 0
      ? Math.round(
          weekAttempts.reduce((sum, a) => sum + a.total_score, 0) /
            weekAttempts.length
        )
      : 0;

  const catErrors: Record<string, number> = {};
  for (const aa of wrongAnswers ?? []) {
    const q = aa.questions as unknown as {
      categories: { name: string } | null;
    } | null;
    const catName = q?.categories?.name ?? "Sem categoria";
    catErrors[catName] = (catErrors[catName] ?? 0) + 1;
  }
  const chartData: ChartDataPoint[] = Object.entries(catErrors)
    .map(([name, erros]) => ({ name, erros }))
    .sort((a, b) => b.erros - a.erros)
    .slice(0, 8);

  return {
    userCount: userCount ?? 0,
    questionCount: questionCount ?? 0,
    categoryCount: categoryCount ?? 0,
    attemptsThisWeek,
    avgScore,
    chartData,
  };
}
