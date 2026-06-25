import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import {
  Users,
  HelpCircle,
  Tag,
  BarChart2,
  TrendingUp,
  ArrowRight,
  CalendarDays,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday.toISOString().slice(0, 10);
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();
  const weekStart = getWeekStart();

  const [
    { count: userCount },
    { count: questionCount },
    { count: categoryCount },
    { data: weekAttempts },
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
  ]);

  const attemptsThisWeek = weekAttempts?.length ?? 0;
  const avgScore =
    weekAttempts && weekAttempts.length > 0
      ? Math.round(
          weekAttempts.reduce((sum, a) => sum + a.total_score, 0) /
            weekAttempts.length
        )
      : 0;

  const stats = [
    { label: "Usuários", value: userCount ?? 0, icon: Users },
    { label: "Perguntas", value: questionCount ?? 0, icon: HelpCircle },
    { label: "Categorias", value: categoryCount ?? 0, icon: Tag },
    {
      label: "Tentativas esta semana",
      value: attemptsThisWeek,
      icon: BarChart2,
    },
    { label: "Média esta semana", value: avgScore, icon: TrendingUp },
  ];

  const quickLinks = [
    { href: "/admin/categories", label: "Categorias", icon: Tag },
    { href: "/admin/questions", label: "Perguntas", icon: HelpCircle },
    { href: "/admin/schedule", label: "Agendamento", icon: CalendarDays },
    { href: "/admin/settings", label: "Configurações", icon: Settings2 },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} size="sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-normal text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {link.label}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
