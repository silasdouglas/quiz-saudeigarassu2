"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
}

interface QuizRunnerProps {
  attemptId: string;
  questions: PlayQuestion[];
  totalQuestionCount: number;
  initialScore: number;
  initialTabSwitches: number;
  tabSwitchPenaltyPoints: number;
  maxTabSwitches: number;
}

export function QuizRunner({
  attemptId,
  questions,
  totalQuestionCount,
  initialScore,
  initialTabSwitches,
  tabSwitchPenaltyPoints,
  maxTabSwitches,
}: QuizRunnerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Option | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<
    { isCorrect: boolean; points: number } | null
  >(null);
  const [score, setScore] = useState(initialScore);
  const [tabSwitches, setTabSwitches] = useState(initialTabSwitches);
  const [timeLeft, setTimeLeft] = useState(questions[0].time_limit_seconds);
  const [pending, setPending] = useState(false);

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

  const handleSubmit = useCallback(async () => {
    setLocked(true);
    setPending(true);
    const timeTaken = (Date.now() - questionStartedAt.current) / 1000;
    try {
      const result = await submitAnswer(
        attemptId,
        currentQuestion.id,
        selected,
        timeTaken
      );
      setScore(result.total_score);
      setFeedback({
        isCorrect: result.is_correct,
        points: result.points_awarded,
      });
    } catch {
      toast.error("Erro ao registrar resposta. Tente novamente.");
      setLocked(false);
    } finally {
      setPending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, currentQuestion.id, selected]);

  useEffect(() => {
    if (locked) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, locked, handleSubmit]);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden) return;
      applyTabSwitchPenalty(attemptId)
        .then((res) => {
          setScore(res.total_score);
          setTabSwitches(res.tab_switch_count);
          if (res.limit_reached) {
            toast.error(
              "Quiz encerrado: limite de trocas de aba foi atingido."
            );
            router.push("/quiz");
          } else {
            toast.warning(
              `Troca de aba detectada: -${tabSwitchPenaltyPoints} pontos (${res.tab_switch_count}/${maxTabSwitches}).`
            );
          }
        })
        .catch(() => {
          // attempt may have just been finished server-side; ignore
        });
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptId, router, tabSwitchPenaltyPoints, maxTabSwitches]);

  function handleNext() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      setPending(true);
      finishQuiz(attemptId);
    }
  }

  const options: { key: Option; text: string }[] = [
    { key: "a", text: currentQuestion.option_a },
    { key: "b", text: currentQuestion.option_b },
    { key: "c", text: currentQuestion.option_c },
    { key: "d", text: currentQuestion.option_d },
  ];

  const progressPct = Math.round(
    ((answeredCount + index) / totalQuestionCount) * 100
  );
  const isLowTime = timeLeft <= 10;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {DIFFICULTY_LABEL[currentQuestion.difficulty]} ·{" "}
              {currentQuestion.points} pts
            </Badge>
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isLowTime && "text-destructive"
              )}
            >
              <Clock className="size-4" />
              {timeLeft}s
            </span>
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
              const showResult = locked && feedback;
              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={locked}
                  onClick={() => setSelected(option.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    !locked && isSelected && "border-primary bg-accent",
                    !locked && !isSelected && "hover:bg-accent/50",
                    showResult && isSelected && feedback?.isCorrect &&
                      "border-emerald-500 bg-emerald-500/10",
                    showResult && isSelected && !feedback?.isCorrect &&
                      "border-destructive bg-destructive/10"
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

          {feedback && (
            <p
              className={cn(
                "text-sm font-medium",
                feedback.isCorrect ? "text-emerald-600" : "text-destructive"
              )}
            >
              {feedback.isCorrect
                ? `Resposta correta! +${feedback.points} pontos`
                : "Resposta incorreta."}
            </p>
          )}

          {!locked ? (
            <Button
              className="w-full"
              disabled={!selected || pending}
              onClick={handleSubmit}
            >
              Confirmar resposta
            </Button>
          ) : (
            <Button className="w-full" disabled={pending} onClick={handleNext}>
              {index + 1 < questions.length
                ? "Próxima pergunta"
                : "Finalizar quiz"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
