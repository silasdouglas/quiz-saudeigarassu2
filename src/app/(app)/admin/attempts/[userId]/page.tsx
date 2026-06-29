import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Target, CheckCircle2, XCircle, Trophy, ListChecks, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserCategoryChart,
  type CategoryAccuracyPoint,
} from "@/components/admin/user-category-chart";
import { AttemptAnswersDialog } from "@/components/admin/attempt-answers-dialog";
import { ResetAttemptButton } from "@/components/admin/reset-attempt-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/types";

interface Overview {
  user_id: string;
  full_name: string;
  email: string;
  funcao: "tecnico" | "enfermeira" | null;
  role: "admin" | "user";
  created_at: string;
  attempts_total: number;
  attempts_completed: number;
  total_answers: number;
  correct_answers: number;
  wrong_answers: number;
  total_score: number;
  avg_time_seconds: number;
}

interface CategoryStat {
  category_id: string | null;
  category_name: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

interface DifficultyStat {
  difficulty: Difficulty;
  total: number;
  correct: number;
  accuracy: number;
}

interface AttemptRow {
  attempt_id: string;
  user_id: string;
  week_start: string;
  status: "in_progress" | "completed" | "reset";
  total_score: number;
  total_time_seconds: number;
  answered_count: number;
  correct_count: number;
}

const FUNCAO_LABEL: Record<string, string> = {
  tecnico: "Técnico de Enfermagem",
  enfermeira: "Enfermeira(o)",
};

function formatWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function accuracyColor(acc: number): string {
  if (acc >= 70) return "text-emerald-600";
  if (acc >= 40) return "text-amber-600";
  return "text-destructive";
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const supabase = await createClient();

  const [
    { data: overviewRows },
    { data: catRows },
    { data: diffRows },
    { data: attemptRows },
  ] = await Promise.all([
    supabase.rpc("admin_get_user_overview", { p_user_id: userId }),
    supabase.rpc("admin_get_user_category_stats", { p_user_id: userId }),
    supabase.rpc("admin_get_user_difficulty_stats", { p_user_id: userId }),
    supabase.rpc("admin_list_attempts"),
  ]);

  const overview = (overviewRows?.[0] ?? null) as Overview | null;
  if (!overview) notFound();

  const categories = (catRows ?? []) as CategoryStat[];
  const difficulties = (diffRows ?? []) as DifficultyStat[];
  const attempts = ((attemptRows ?? []) as AttemptRow[]).filter(
    (a) => a.user_id === userId
  );

  const overallAccuracy =
    overview.total_answers > 0
      ? Math.round((overview.correct_answers / overview.total_answers) * 100)
      : 0;

  // strong/weak only consider categories with at least 2 answers for relevance
  const ranked = categories.filter((c) => c.total >= 2);
  const strong = [...ranked].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
  const weak = [...ranked].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  const chartData: CategoryAccuracyPoint[] = categories.map((c) => ({
    name: c.category_name,
    accuracy: Number(c.accuracy),
    total: c.total,
  }));

  const kpis = [
    { label: "Tentativas", value: `${overview.attempts_completed}/${overview.attempts_total}`, icon: ListChecks, chip: "bg-sky-500/15 text-sky-500" },
    { label: "Taxa de acerto", value: `${overallAccuracy}%`, icon: Target, chip: "bg-violet-500/15 text-violet-500" },
    { label: "Acertos", value: `${overview.correct_answers}`, icon: CheckCircle2, chip: "bg-emerald-500/15 text-emerald-500" },
    { label: "Erros", value: `${overview.wrong_answers}`, icon: XCircle, chip: "bg-rose-500/15 text-rose-500" },
    { label: "Pontos totais", value: `${overview.total_score}`, icon: Trophy, chip: "bg-amber-500/15 text-amber-500" },
    { label: "Tempo médio", value: `${overview.avg_time_seconds}s`, icon: Clock, chip: "bg-slate-500/15 text-slate-500" },
  ];

  return (
    <div>
      <Link
        href="/admin/attempts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para tentativas
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {(overview.full_name || overview.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            {overview.full_name || overview.email}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {overview.email}
            {overview.role === "admin" && (
              <Badge variant="secondary" className="text-[10px]">admin</Badge>
            )}
            {overview.funcao && (
              <Badge variant="outline" className="text-[10px]">
                {FUNCAO_LABEL[overview.funcao]}
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex flex-col gap-2 p-4">
              <span className={`flex size-8 items-center justify-center rounded-lg ${k.chip}`}>
                <k.icon className="size-4" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none tabular-nums">{k.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {overview.total_answers === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Este usuário ainda não respondeu nenhuma pergunta.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Strong / weak */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pontos fortes e fracos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <TrendingUp className="size-4" /> Mais forte
                </p>
                {strong.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Dados insuficientes.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {strong.map((c) => (
                      <li key={c.category_name} className="flex items-center justify-between text-sm">
                        <span>{c.category_name}</span>
                        <span className={`font-semibold tabular-nums ${accuracyColor(c.accuracy)}`}>
                          {c.accuracy}% <span className="text-xs font-normal text-muted-foreground">({c.correct}/{c.total})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <TrendingDown className="size-4" /> Mais fraco
                </p>
                {weak.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Dados insuficientes.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {weak.map((c) => (
                      <li key={c.category_name} className="flex items-center justify-between text-sm">
                        <span>{c.category_name}</span>
                        <span className={`font-semibold tabular-nums ${accuracyColor(c.accuracy)}`}>
                          {c.accuracy}% <span className="text-xs font-normal text-muted-foreground">({c.correct}/{c.total})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Difficulty breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acerto por dificuldade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["facil", "media", "dificil"] as Difficulty[]).map((d) => {
                const stat = difficulties.find((x) => x.difficulty === d);
                const acc = stat ? Number(stat.accuracy) : 0;
                const total = stat?.total ?? 0;
                return (
                  <div key={d}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{DIFFICULTY_LABEL[d]}</span>
                      <span className={`font-semibold tabular-nums ${accuracyColor(acc)}`}>
                        {total > 0 ? `${acc}%` : "—"}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          ({stat?.correct ?? 0}/{total})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Category accuracy chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Acerto por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCategoryChart data={chartData} />
            </CardContent>
          </Card>

          {/* Attempts + gabarito */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Tentativas e gabarito</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma tentativa registrada.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semana</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Pontos</TableHead>
                        <TableHead className="text-right">Acertos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.map((a) => (
                        <TableRow key={a.attempt_id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatWeek(a.week_start)}
                          </TableCell>
                          <TableCell>
                            {a.status === "completed" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                Concluído
                              </Badge>
                            ) : a.status === "reset" ? (
                              <Badge variant="outline" className="text-sky-600 border-sky-300">
                                Pendente
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                Em andamento
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {a.total_score}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {a.correct_count}/{a.answered_count}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <AttemptAnswersDialog
                                attemptId={a.attempt_id}
                                userName={overview.full_name || overview.email}
                              />
                              <ResetAttemptButton
                                attemptId={a.attempt_id}
                                userName={overview.full_name || overview.email}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
