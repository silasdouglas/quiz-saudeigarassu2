"use client";

import { useCallback, useState, useTransition } from "react";
import { Users, HelpCircle, Tag, BarChart2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryErrorChart } from "@/components/admin/category-error-chart";
import { fetchAdminStatsAction, type AdminStats } from "@/app/(app)/admin/actions";
import { useRealtimeTable } from "@/lib/hooks/use-realtime";

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

export function AdminDashboardLive({ initialStats }: { initialStats: AdminStats }) {
  const [stats, setStats] = useState(initialStats);
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const data = await fetchAdminStatsAction();
      setStats(data);
    });
  }, []);

  useRealtimeTable("quiz_attempts", refresh);
  useRealtimeTable("profiles", refresh);

  const statRows = [
    { label: "Usuários", value: stats.userCount, Icon: Users },
    { label: "Perguntas", value: stats.questionCount, Icon: HelpCircle },
    { label: "Categorias", value: stats.categoryCount, Icon: Tag },
    { label: "Tentativas esta semana", value: stats.attemptsThisWeek, Icon: BarChart2 },
    { label: "Média esta semana", value: stats.avgScore, Icon: TrendingUp },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statRows.map((stat, i) => {
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

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Erros por categoria
        </h2>
        <Card className="p-4">
          <CategoryErrorChart data={stats.chartData} />
        </Card>
      </div>
    </>
  );
}
