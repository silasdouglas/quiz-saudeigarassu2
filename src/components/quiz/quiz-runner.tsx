"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Flag, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { playCorrect, playWrong, primeAudio } from "@/lib/sounds";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL, type Difficulty, type Option } from "@/lib/types";
import {
  applyTabSwitchPenalty,
  finishQuiz,
  submitAnswer,
} from "@/app/(app)/quiz/actions";
import { createClient } from "@/lib/supabase/client";

interface PlayQuestion {
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
  source?: string;
  category_name?: string;
}

interface QuizRunnerProps {
  attemptId: string;
  questions: PlayQuestion[];
  totalQuestionCount: number;
  initialScore: number;
  initialTabSwitches: number;
  maxTabSwitches: number;
}

export function QuizRunner({
  attemptId,
  questions,
  totalQuestionCount,
  initialScore,
  initialTabSwitches,
  maxTabSwitches,
}: QuizRunnerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Option | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<{
    points: number;
    correct: boolean;
  } | null>(null);
  const [score, setScore] = useState(initialScore);
  const [tabSwitches, setTabSwitches] = useState(initialTabSwitches);
  const [tabWarned, setTabWarned] = useState(initialTabSwitches >= 1);
  const [timeLeft, setTimeLeft] = useState(questions[0].time_limit_seconds);
  const [, setPending] = useState(false);

  const questionStartedAt = useRef(Date.now());
  const answeredCount = totalQuestionCount - questions.length;
  const currentQuestion = questions[index];

  useEffect(() => {
    setTimeLeft(questions[index].time_limit_seconds);
    questionStartedAt.current = Date.now();
    setSelected(null);
    setLocked(false);
    setFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handleSubmit = useCallback(
    async (choice?: Option | null) => {
      const answer = choice !== undefined ? choice : selected;
      if (choice !== undefined) setSelected(choice);
      setLocked(true);
      setPending(true);
      const timeTaken = (Date.now() - questionStartedAt.current) / 1000;
      try {
        const result = await submitAnswer(
          attemptId,
          currentQuestion.id,
          answer,
          timeTaken
        );
        setScore(result.total_score);
        setFeedback({
          points: result.points_awarded,
          correct: result.is_correct,
        });
        if (result.is_correct) playCorrect();
        else playWrong();
      } catch {
        toast.error("Erro ao registrar resposta. Tente novamente.");
        setLocked(false);
      } finally {
        setPending(false);
      }
    },
    [attemptId, currentQuestion.id, selected]
  );

  useEffect(() => {
    if (locked) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, locked, handleSubmit]);

  const handleNext = useCallback(() => {
    // Reset before setIndex so the next render never briefly shows stale feedback
    setSelected(null);
    setLocked(false);
    setFeedback(null);
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      setPending(true);
      finishQuiz(attemptId);
    }
  }, [index, questions.length, attemptId]);

  // Auto-advance to the next question after revealing the result.
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => handleNext(), 1900);
    return () => clearTimeout(t);
  }, [feedback, handleNext]);

  // Detect admin-initiated reset (DELETE on quiz_attempts row) and redirect.
  // Must use DELETE-only event — UPDATE fires on every score change and would
  // incorrectly kick the user out of the quiz.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`attempt-reset-${attemptId}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "quiz_attempts", filter: `id=eq.${attemptId}` },
        () => {
          toast.error("Sua tentativa foi reiniciada pelo administrador.");
          router.push("/quiz");
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [attemptId, router]);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden) return;
      applyTabSwitchPenalty(attemptId)
        .then((res) => {
          setTabSwitches(res.tab_switch_count);
          if (res.limit_reached) {
            toast.error("Quiz suspenso: segunda troca de aba detectada. Pontuação registrada como zero.");
            router.push("/quiz");
          } else {
            setTabWarned(true);
          }
        })
        .catch((err) => {
          toast.error(`Erro ao registrar troca de aba: ${err?.message ?? "desconhecido"}`);
        });
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptId, router, maxTabSwitches]);

  const options: { key: Option; text: string }[] = [
    { key: "a", text: currentQuestion.option_a },
    { key: "b", text: currentQuestion.option_b },
    { key: "c", text: currentQuestion.option_c },
    { key: "d", text: currentQuestion.option_d },
  ];

  const progressPct = Math.round(
    ((answeredCount + index) / totalQuestionCount) * 100
  );
  const timeFrac = timeLeft / currentQuestion.time_limit_seconds;
  const isLowTime = timeFrac <= 0.1; // 10% restante → vermelho
  const isMidTime = timeFrac <= 0.5; // 50% restante → amarelo
  const timeBarColor = isLowTime
    ? "bg-destructive"
    : isMidTime
      ? "bg-amber-500"
      : "bg-primary";
  const timeTextColor = isLowTime
    ? "text-destructive"
    : isMidTime
      ? "text-amber-500"
      : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {tabWarned && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-400/50 bg-orange-50 px-4 py-3 dark:bg-orange-950/30">
          <ShieldAlert className="mt-px size-4 shrink-0 text-orange-500" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            <span className="font-semibold">Atenção:</span> troca de aba detectada.
            Se sair novamente, o quiz será encerrado e sua pontuação será registrada como zero.
          </p>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Pergunta {answeredCount + index + 1} de {totalQuestionCount}
        </span>
        <span className="flex items-center gap-3">
          <Badge variant="secondary">{score} pts</Badge>
          {tabWarned && (
            <span className="flex items-center gap-1 text-orange-500">
              <ShieldAlert className="size-4" />
              Aviso ativo
            </span>
          )}
        </span>
      </div>

      <div className="mb-6 h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="relative">
        {feedback && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            {feedback.correct ? (
              <>
                <div
                  className="animate-quiz-ring-pulse absolute size-24 rounded-full border-4 border-emerald-400"
                  style={{ opacity: 0 }}
                />
                <div
                  className="animate-quiz-ring-pulse absolute size-24 rounded-full border-4 border-emerald-300"
                  style={{ opacity: 0, animationDelay: "0.18s" }}
                />
                <div className="animate-quiz-pop flex size-24 items-center justify-center rounded-full bg-emerald-500/90 shadow-xl shadow-emerald-500/40">
                  <Check className="size-12 text-white" strokeWidth={3} />
                </div>
                {feedback.points > 0 && (
                  <div className="animate-quiz-float-score absolute text-2xl font-black text-emerald-500 drop-shadow-lg">
                    +{feedback.points} pts
                  </div>
                )}
                {Array.from({ length: 22 }).map((_, i) => (
                  <span
                    key={i}
                    className="animate-quiz-confetti absolute top-0 block rounded-sm"
                    style={{
                      left: `${4 + (i * 92) / 22}%`,
                      width: [10, 6, 8, 5, 9][i % 5],
                      height: [10, 6, 4, 8, 5][i % 5],
                      backgroundColor: [
                        "#10b981",
                        "#f59e0b",
                        "#3b82f6",
                        "#ef4444",
                        "#a855f7",
                        "#ec4899",
                      ][i % 6],
                      animationDelay: `${(i % 7) * 0.05}s`,
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                <div
                  className="animate-quiz-ring-pulse absolute size-24 rounded-full border-4 border-destructive/60"
                  style={{ opacity: 0 }}
                />
                <div className="animate-quiz-pop flex size-24 items-center justify-center rounded-full bg-destructive/90 shadow-xl shadow-destructive/40">
                  <X className="size-12 text-white" strokeWidth={3} />
                </div>
              </>
            )}
          </div>
        )}
        <Card
          className={cn(feedback && !feedback.correct && "animate-quiz-shake")}
        >
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                currentQuestion.difficulty === "facil" &&
                  "border-emerald-300 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                currentQuestion.difficulty === "media" &&
                  "border-amber-300 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                currentQuestion.difficulty === "dificil" &&
                  "border-red-300 bg-red-500/10 text-red-600 dark:text-red-400"
              )}
            >
              <Flag className="size-3.5 fill-current" />
              {DIFFICULTY_LABEL[currentQuestion.difficulty]} ·{" "}
              {currentQuestion.points} pts
            </Badge>
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-medium tabular-nums",
                timeTextColor
              )}
            >
              <Clock className="size-4" />
              {timeLeft}s
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentQuestion.category_name && (
              <Badge
                variant="secondary"
                className="border-violet-200 bg-violet-500/10 text-xs text-violet-700 dark:text-violet-300"
              >
                {currentQuestion.category_name}
              </Badge>
            )}
            {(!currentQuestion.target_role || currentQuestion.target_role === "ambos") && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Todos
              </Badge>
            )}
            {currentQuestion.target_role === "tecnico" && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
                Técnico de Enfermagem
              </Badge>
            )}
            {currentQuestion.target_role === "enfermeira" && (
              <Badge variant="secondary" className="bg-pink-500/10 text-pink-700 dark:text-pink-300 text-xs">
                Enfermeira(o)
              </Badge>
            )}
          </div>
          {/* countdown bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                timeBarColor
              )}
              style={{
                width: `${Math.round(timeFrac * 100)}%`,
              }}
            />
          </div>
          <CardTitle className="pt-2 text-lg leading-snug">
            {currentQuestion.question_text}
          </CardTitle>
          {currentQuestion.source ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Fonte: {currentQuestion.source}
            </p>
          ) : (
            <CardDescription className="sr-only">
              Selecione uma alternativa
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {options.map((option) => {
              const isSelected = selected === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    primeAudio();
                    setSelected(option.key);
                    handleSubmit(option.key);
                  }}
                  className={cn(
                    "flex touch-manipulation select-none items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-[colors,transform]",
                    !locked && "cursor-pointer active:scale-[0.98] active:bg-accent",
                    isSelected && !locked && "border-primary bg-accent",
                    locked && isSelected && !feedback && "border-primary bg-accent",
                    locked &&
                      isSelected &&
                      feedback?.correct &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    locked &&
                      isSelected &&
                      feedback &&
                      !feedback.correct &&
                      "border-destructive bg-destructive/10 text-destructive",
                    !locked && !isSelected && "hover:bg-accent/50"
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase">
                    {option.key}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>

          {locked ? (
            <div
              className={cn(
                "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium",
                feedback?.correct
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              <span>
                {feedback?.correct
                  ? `Acertou! +${feedback.points} pts`
                  : "Resposta incorreta"}
              </span>
              <span className="text-xs font-normal opacity-70">
                {index + 1 < questions.length
                  ? "Próxima pergunta…"
                  : "Finalizando…"}
              </span>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Toque em uma alternativa para responder.
            </p>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
