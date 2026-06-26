"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, ShieldAlert, X } from "lucide-react";
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
  const [tabWarning, setTabWarning] = useState<{
    count: number;
    max: number;
  } | null>(null);
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

  useEffect(() => {
    if (!tabWarning) return;
    const t = setTimeout(() => setTabWarning(null), 3000);
    return () => clearTimeout(t);
  }, [tabWarning]);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden) return;
      applyTabSwitchPenalty(attemptId)
        .then((res) => {
          setTabSwitches(res.tab_switch_count);
          if (res.limit_reached) {
            toast.error(
              "Quiz encerrado: limite de trocas de aba foi atingido."
            );
            router.push("/quiz");
          } else {
            setTabWarning({ count: res.tab_switch_count, max: maxTabSwitches });
          }
        })
        .catch(() => {
          // attempt may have just been finished server-side; ignore
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
      {tabWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="animate-quiz-warning-in mx-4 flex flex-col items-center gap-4 rounded-2xl border border-orange-400/60 bg-background px-10 py-8 shadow-2xl shadow-orange-500/20 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <ShieldAlert className="size-9 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                Troca de aba detectada!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tabWarning.count} de {tabWarning.max} trocas permitidas
              </p>
            </div>
            <div className="w-full overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/30" style={{ height: 6 }}>
              <div
                className="h-full rounded-full bg-orange-400 transition-none"
                style={{
                  width: `${((tabWarning.max - tabWarning.count) / tabWarning.max) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Pergunta {answeredCount + index + 1} de {totalQuestionCount}
        </span>
        <span className="flex items-center gap-3">
          <Badge variant="secondary">{score} pts</Badge>
          {tabSwitches > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <ShieldAlert className="size-4" />
              {tabSwitches}/{maxTabSwitches}
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
            <Badge variant="outline">
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
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.category_name}
              </Badge>
            )}
            {(!currentQuestion.target_role || currentQuestion.target_role === "ambos") && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Todos
              </Badge>
            )}
            {currentQuestion.target_role === "tecnico_enfermagem" && (
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
          <CardDescription className="sr-only">
            Selecione uma alternativa
          </CardDescription>
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
                    "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    !locked && "cursor-pointer",
                    isSelected && !locked && "border-primary bg-accent",
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
