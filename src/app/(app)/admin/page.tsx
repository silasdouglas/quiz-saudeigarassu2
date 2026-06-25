import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import { Users, HelpCircle, Tag, BarChart2, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryErrorChart } from "@/components/admin/category-error-chart";
import type { ChartDataPoint } from "@/components/admin/category-error-chart";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday.toISOString().slice(0, 10);
}

const STAT_COLORS = [
  "bg-gradient-to-br from-sky-500/15 to-transparent border-sky-500/20",
  "bg-gradient-to-br from-violet-500/15 to-transparent border-violet-500/20",
  "bg-gradient-to-br from-amber-500/15 to-transparent border-amber-500/20",
  "bg-gradient-to-br from-emerald-500/15 to-transparent border-emerald-500/20",
  "bg-gradient-to-br from-rose-500/15 to-transparent border-rose-500/20",
] as const;

const STAT_ICON_CHIP = [
  "bg-sky-500/15 text-sky-500",
  "bg-violet-500/15 text-violet-500",
  "bg-amber-500/15 text-amber-500",
  "bg-emerald-500/15 text-emerald-500",
  "bg-rose-500/15 text-rose-500",
] as const;

export default async function AdminDashboardPage() {
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

  // Aggregate errors by category
  const catErrors: Record<string, number> = {};
  for (const aa of wrongAnswers ?? []) {
    const q = aa.questions as unknown as { categories: { name: string } | null } | null;
    const catName = q?.categories?.name ?? "Sem categoria";
    catErrors[catName] = (catErrors[catName] ?? 0) + 1;
  }
  const chartData: ChartDataPoint[] = Object.entries(catErrors)
    .map(([name, erros]) => ({ name, erros }))
    .sort((a, b) => b.erros - a.erros)
    .slice(0, 8);

  const stats = [
    { label: "Usuários", value: userCount ?? 0, Icon: Users },
    { label: "Perguntas", value: questionCount ?? 0, Icon: HelpCircle },
    { label: "Categorias", value: categoryCount ?? 0, Icon: Tag },
    { label: "Tentativas esta semana", value: attemptsThisWeek, Icon: BarChart2 },
    { label: "Média esta semana", value: avgScore, Icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat, i) => {
          const { Icon } = stat;
          return (
            <Card
              key={stat.label}
              size="sm"
              className={`shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${STAT_COLORS[i % STAT_COLORS.length]}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xs font-normal text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${STAT_ICON_CHIP[i % STAT_ICON_CHIP.length]}`}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums tracking-tight">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error by category chart */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Erros por categoria
        </h2>
        <Card className="p-4">
          <CategoryErrorChart data={chartData} />
        </Card>
      </div>
    </div>
  );
}
