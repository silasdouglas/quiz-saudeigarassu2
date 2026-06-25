"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addQuestion } from "@/app/(app)/admin/schedule/actions";
import type { Difficulty } from "@/lib/types";
import { DIFFICULTY_LABEL } from "@/lib/types";

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  facil: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  media: "bg-amber-500/10 text-amber-600 border-amber-200",
  dificil: "bg-red-500/10 text-red-600 border-red-200",
};

interface AvailableQuestion {
  id: string;
  question_text: string;
  difficulty: Difficulty;
  time_limit_seconds: number;
  categories: { name: string } | null;
}

interface Props {
  scheduleId: string;
  questions: AvailableQuestion[];
}

export function AddQuestionToScheduleDialog({ scheduleId, questions }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  function handleAdd(questionId: string) {
    startTransition(async () => {
      await addQuestion(scheduleId, questionId);
      setAddedIds((prev) => new Set([...prev, questionId]));
    });
  }

  const visibleQuestions = questions.filter((q) => !addedIds.has(q.id));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setAddedIds(new Set());
        setOpen(next);
      }}
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Plus className="size-4" />
        Adicionar pergunta
      </Button>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar pergunta</DialogTitle>
          <DialogDescription>
            Selecione uma pergunta para incluir no agendamento desta semana.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {visibleQuestions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todas as perguntas ativas já foram adicionadas.
            </p>
          )}
          {visibleQuestions.map((q) => (
            <div
              key={q.id}
              className="flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{q.question_text}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className={DIFFICULTY_BADGE_CLASS[q.difficulty]}
                  >
                    {DIFFICULTY_LABEL[q.difficulty]}
                  </Badge>
                  {q.categories && (
                    <Badge variant="outline">{q.categories.name}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {q.time_limit_seconds}s
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleAdd(q.id)}
              >
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
