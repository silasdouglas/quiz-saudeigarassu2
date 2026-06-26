"use client";

import { useState, useTransition } from "react";
import { Check, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL, type Option } from "@/lib/types";
import {
  getAttemptAnswers,
  type AttemptAnswerDetail,
} from "@/app/(app)/admin/attempts/actions";

const OPTION_KEYS: Option[] = ["a", "b", "c", "d"];

export function AttemptAnswersDialog({
  attemptId,
  userName,
}: {
  attemptId: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<AttemptAnswerDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen(next: boolean) {
    setOpen(next);
    if (next && answers === null) {
      startTransition(async () => {
        try {
          setAnswers(await getAttemptAnswers(attemptId));
        } catch {
          setError("Erro ao carregar respostas.");
        }
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => handleOpen(true)}
        aria-label="Ver respostas"
      >
        <FileText className="size-4" />
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Respostas — {userName}</DialogTitle>
          <DialogDescription>
            Alternativa marcada vs. correta para cada pergunta.
          </DialogDescription>
        </DialogHeader>

        {isPending && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Carregando…
          </p>
        )}
        {error && <p className="py-6 text-center text-sm text-destructive">{error}</p>}
        {answers && answers.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma resposta registrada.
          </p>
        )}

        <div className="space-y-3">
          {answers?.map((a, i) => {
            const opts: Record<Option, string> = {
              a: a.option_a,
              b: a.option_b,
              c: a.option_c,
              d: a.option_d,
            };
            return (
              <div key={a.question_id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">
                    {i + 1}. {a.question_text}
                  </p>
                  {a.is_correct ? (
                    <Badge className="shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                      +{a.points_awarded}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-destructive border-destructive/30">
                      0 pts
                    </Badge>
                  )}
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {DIFFICULTY_LABEL[a.difficulty]}
                  </Badge>
                  {a.category_name && (
                    <Badge variant="outline" className="text-xs">
                      {a.category_name}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {a.time_taken_seconds.toFixed(1)}s
                  </span>
                </div>
                <div className="grid gap-1">
                  {OPTION_KEYS.map((key) => {
                    const isSelected = a.selected_option === key;
                    const isCorrect = a.correct_option === key;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm",
                          isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                          isSelected && !isCorrect && "border-destructive bg-destructive/10 text-destructive"
                        )}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold uppercase">
                          {key}
                        </span>
                        <span className="min-w-0 flex-1">{opts[key]}</span>
                        {isCorrect && <Check className="size-4 shrink-0 text-emerald-600" />}
                        {isSelected && !isCorrect && <X className="size-4 shrink-0 text-destructive" />}
                      </div>
                    );
                  })}
                </div>
                {a.selected_option === null && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Não respondida (tempo esgotado).
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
