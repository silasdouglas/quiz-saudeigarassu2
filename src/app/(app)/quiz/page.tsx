import Link from "next/link";
import { Clock, ListChecks, ShieldAlert, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { startQuiz } from "@/app/(app)/quiz/actions";
import { computeWeekStart } from "@/lib/week";

export default async function QuizPage() {
  const profile = await requireUser();
  const supabase = await createClient();
  const weekStart = computeWeekStart();

  // attempt + settings in parallel — no waterfall
  const [attemptResult, settingsResult] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("id, status, total_score, total_time_seconds, tab_switch_count")
      .eq("user_id", profile.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("quiz_settings")
      .select("tab_switch_penalty_points, max_tab_switches")
      .single(),
  ]);

  const attempt = attemptResult.data;

  const isAdmin = profile.role === "admin";

  if (attempt?.status === "completed" && !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
            <Trophy className="size-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold">Quiz concluído!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Volte na próxima semana para um novo desafio.
          </p>

          <div className="my-6 rounded-xl bg-muted/60 p-4">
            <p className="text-4xl font-bold text-foreground">
              {attempt.total_score}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">pontos</p>
          </div>

          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span>
              {Math.round(attempt.total_time_seconds)}s de tempo total
            </span>
            <span>·</span>
            <span>{attempt.tab_switch_count} trocas de aba</span>
          </div>

          <Separator className="my-6" />

          <Button asChild className="w-full">
            <Link href="/ranking">
              Ver ranking
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // schedule query parallel with settings (already fetched above)
  const { data: schedule } = await supabase
    .from("weekly_schedules")
    .select("id")
    .eq("week_start", weekStart)
    .maybeSingle();

  let questionCount = 0;
  let estimatedSeconds = 0;
  let maxPoints = 0;

  if (schedule) {
    const { data: rows } = await supabase
      .from("schedule_questions")
      .select("questions(time_limit_seconds, points, target_role)")
      .eq("schedule_id", schedule.id);

    // Match the play page: admins see every função, users only their own.
    const visible = (rows ?? []).filter((row) => {
      const q = row.questions as unknown as
        | { target_role?: string | null }
        | null;
      if (!q) return false;
      return (
        isAdmin ||
        !q.target_role ||
        q.target_role === "ambos" ||
        q.target_role === profile.funcao
      );
    });

    questionCount = visible.length;
    estimatedSeconds = visible.reduce((sum, row) => {
      const q = row.questions as unknown as
        | { time_limit_seconds: number }
        | null;
      return sum + (q?.time_limit_seconds ?? 60);
    }, 0);
    maxPoints = visible.reduce((sum, row) => {
      const q = row.questions as unknown as { points?: number } | null;
      return sum + (q?.points ?? 0);
    }, 0);
  }

  const settings = settingsResult.data;

  const isResume = attempt?.status === "in_progress";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {isResume ? "Continuar quiz" : "Quiz da semana"}
          </h1>
          {isResume && (
            <Badge variant="secondary" className="gap-1">
              <RotateCcw className="size-3" />
              Em andamento
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isResume
            ? "Você tem perguntas pendentes. Retome onde parou."
            : "Leia as instruções com atenção antes de começar."}
        </p>
      </div>

      {isAdmin && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          <span className="font-medium text-primary">Modo treino (admin):</span>{" "}
          você pode refazer o quiz quantas vezes quiser. Suas tentativas não são
          gravadas no ranking.
        </div>
      )}

      <div className="space-y-3">
        {/* Perguntas */}
        <div className="group flex items-start gap-4 rounded-2xl border bg-gradient-to-br from-primary/[0.07] to-transparent p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
            <ListChecks className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Formato</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {questionCount} pergunta{questionCount !== 1 ? "s" : ""} de
              múltipla escolha — fácil (5 pts), média (10 pts), difícil (15 pts).
              {maxPoints > 0 && (
                <> Máximo desta semana: <span className="font-semibold text-foreground">{maxPoints} pts</span>.</>
              )}
            </p>
          </div>
        </div>

        {/* Tempo */}
        <div className="group flex items-start gap-4 rounded-2xl border bg-gradient-to-br from-amber-500/[0.08] to-transparent p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/10">
            <Clock className="size-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Tempo</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Cada pergunta tem um timer próprio. Estimativa total: ~
              {Math.ceil(estimatedSeconds / 60)} min. Menos tempo = melhor
              posição no ranking.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="group flex items-start gap-4 rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/[0.09] to-transparent p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/5 ring-1 ring-destructive/10">
            <ShieldAlert className="size-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-destructive">Atenção</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Não saia da aba. Cada troca desconta{" "}
              {settings?.tab_switch_penalty_points ?? 5} pts. Após{" "}
              {settings?.max_tab_switches ?? 3} trocas, o quiz é encerrado.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {questionCount === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum quiz foi agendado para esta semana. Volte mais tarde.
          </div>
        ) : (
          <form action={startQuiz}>
            <Button type="submit" size="lg" className="w-full gap-2">
              {isResume ? (
                <>
                  <RotateCcw className="size-4" />
                  Continuar quiz
                </>
              ) : (
                <>
                  Iniciar quiz
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
