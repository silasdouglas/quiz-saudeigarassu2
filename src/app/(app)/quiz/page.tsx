import Link from "next/link";
import { AlertTriangle, ArrowRight, Award, CheckCircle2, Clock3, RotateCcw, Timer, Trophy } from "lucide-react";
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

  const weekEnd = (() => {
    const [y, m, d] = weekStart.split("-").map(Number);
    const sun = new Date(y, m - 1, d + 6);
    return sun.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  })();
  const weekStartFmt = (() => {
    const [y, m, d] = weekStart.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  })();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {questionCount === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum quiz foi agendado para esta semana. Volte mais tarde.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="border-b bg-primary px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                  Instruções
                </p>
                <h1 className="mt-0.5 text-lg font-bold text-primary-foreground">
                  {isResume ? "Continuar quiz" : "Quiz da semana"}
                </h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-foreground/60">Período</p>
                <p className="text-sm font-semibold text-primary-foreground">
                  {weekStartFmt} — {weekEnd}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x border-b bg-muted/30">
            <div className="px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-primary">
                <CheckCircle2 className="size-4" />
                <span className="text-xl font-bold">{questionCount}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {questionCount === 1 ? "pergunta" : "perguntas"}
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-600">
                <Award className="size-4" />
                <span className="text-xl font-bold">{maxPoints}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">pts máximos</p>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-blue-600">
                <Clock3 className="size-4" />
                <span className="text-xl font-bold">~{Math.ceil(estimatedSeconds / 60)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">min estimados</p>
            </div>
          </div>

          {/* Rules */}
          <div className="px-6 py-5 space-y-3">
            {isAdmin && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Modo treino (admin):</span>{" "}
                refaça quantas vezes quiser. Tentativas não entram no ranking.
              </div>
            )}

            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Como funciona
            </p>

            <ol className="space-y-2.5">
              <li className="flex items-start gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                <span className="text-muted-foreground">
                  Perguntas de múltipla escolha com pontuação por dificuldade:
                  {" "}<span className="font-medium text-foreground">fácil 5 pts · média 10 pts · difícil 15 pts</span>.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                <span className="text-muted-foreground">
                  Cada pergunta tem um timer individual.{" "}
                  <span className="font-medium text-foreground">Menos tempo = melhor posição no ranking</span>{" "}
                  em caso de empate de pontos.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                <span className="text-muted-foreground">
                  Uma única tentativa por semana. Não é possível rever ou alterar respostas.
                </span>
              </li>
            </ol>

            <div className="mt-1 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-2.5">
              <AlertTriangle className="mt-px size-4 shrink-0 text-destructive" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-destructive">Não saia da aba</span>{" "}
                durante o quiz. Na <span className="font-medium text-foreground">1ª troca</span> você receberá um aviso e poderá continuar.
                Na <span className="font-medium text-foreground">2ª troca</span> o quiz é encerrado e sua pontuação é registrada como{" "}
                <span className="font-medium text-foreground">zero</span> — sem nova tentativa até a próxima semana.
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="border-t bg-muted/20 px-6 py-4">
            {isResume && (
              <p className="mb-3 text-center text-xs text-muted-foreground">
                Você tem perguntas pendentes. Retome onde parou.
              </p>
            )}
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
          </div>
        </div>
      )}
    </div>
  );
}
