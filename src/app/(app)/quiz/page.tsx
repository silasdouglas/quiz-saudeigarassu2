import Link from "next/link";
import { Clock, ListChecks, ShieldAlert, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { startQuiz } from "@/app/(app)/quiz/actions";

export default async function QuizPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: weekStart } = await supabase.rpc("current_week_start");

  const { data: attempt } = weekStart
    ? await supabase
        .from("quiz_attempts")
        .select(
          "id, status, total_score, total_time_seconds, tab_switch_count"
        )
        .eq("user_id", profile.id)
        .eq("week_start", weekStart)
        .maybeSingle()
    : { data: null };

  if (attempt?.status === "completed") {
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

  const { data: schedule } = weekStart
    ? await supabase
        .from("weekly_schedules")
        .select("id")
        .eq("week_start", weekStart)
        .maybeSingle()
    : { data: null };

  let questionCount = 0;
  let estimatedSeconds = 0;

  if (schedule) {
    const { data: rows } = await supabase
      .from("schedule_questions")
      .select("questions(time_limit_seconds)")
      .eq("schedule_id", schedule.id);

    questionCount = rows?.length ?? 0;
    estimatedSeconds =
      rows?.reduce((sum, row) => {
        const q = row.questions as unknown as
          | { time_limit_seconds: number }
          | null;
        return sum + (q?.time_limit_seconds ?? 60);
      }, 0) ?? 0;
  }

  const { data: settings } = await supabase
    .from("quiz_settings")
    .select("tab_switch_penalty_points, max_tab_switches")
    .single();

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

      <div className="space-y-3">
        {/* Perguntas */}
        <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ListChecks className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Formato</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {questionCount} pergunta{questionCount !== 1 ? "s" : ""} de
              múltipla escolha — fácil (5 pts), média (10 pts), difícil (15 pts).
            </p>
          </div>
        </div>

        {/* Tempo */}
        <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock className="size-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Tempo</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Cada pergunta tem um timer próprio. Estimativa total: ~
              {Math.ceil(estimatedSeconds / 60)} min. Menos tempo = melhor
              posição no ranking.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-start gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <ShieldAlert className="size-4 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">Atenção</p>
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
