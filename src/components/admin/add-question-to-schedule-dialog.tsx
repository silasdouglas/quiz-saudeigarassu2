"use client";

import { useState, useTransition } from "react";
import { Plus, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addQuestion, addRandomQuestions } from "@/app/(app)/admin/schedule/actions";
import type { Difficulty } from "@/lib/types";
import { DIFFICULTY_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  facil: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  media: "bg-amber-500/10 text-amber-600 border-amber-200",
  dificil: "bg-red-500/10 text-red-600 border-red-200",
};

type TargetRole = "all" | "tecnico_enfermagem" | "enfermeira";

const ROLE_LABELS: Record<TargetRole, string> = {
  all: "Todos",
  tecnico_enfermagem: "Técnicos",
  enfermeira: "Enfermeiras",
};

interface AvailableQuestion {
  id: string;
  question_text: string;
  difficulty: Difficulty;
  time_limit_seconds: number;
  target_role?: string | null;
  categories: { name: string } | null;
}

interface Props {
  scheduleId: string;
  questions: AvailableQuestion[];
  neverScheduledIds: string[];
}

export function AddQuestionToScheduleDialog({ scheduleId, questions, neverScheduledIds }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [drawCount, setDrawCount] = useState(10);
  const [drawRole, setDrawRole] = useState<TargetRole>("all");

  const freshSet = new Set(neverScheduledIds);
  const visibleQuestions = questions.filter((q) => !addedIds.has(q.id));

  const freshAvailable = visibleQuestions.filter((q) => {
    if (!freshSet.has(q.id)) return false;
    if (drawRole === "all") return true;
    const role = q.target_role ?? "ambos";
    return role === drawRole || role === "ambos";
  }).length;

  function handleAdd(questionId: string) {
    startTransition(async () => {
      await addQuestion(scheduleId, questionId);
      setAddedIds((prev) => new Set([...prev, questionId]));
    });
  }

  function handleRandom() {
    startTransition(async () => {
      const { addedIds: newIds } = await addRandomQuestions(scheduleId, drawCount, drawRole);
      setAddedIds((prev) => new Set([...prev, ...newIds]));
    });
  }

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

      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar pergunta</DialogTitle>
          <DialogDescription>
            Selecione individualmente ou sorteie perguntas inéditas para esta semana.
          </DialogDescription>
        </DialogHeader>

        {/* Random draw toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3">
          <Shuffle className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium">Sortear</span>
          <input
            type="number"
            min={1}
            max={freshAvailable || 1}
            value={drawCount}
            onChange={(e) => setDrawCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-sm outline-none focus:border-ring"
          />
          <span className="text-sm text-muted-foreground">para</span>
          <select
            value={drawRole}
            onChange={(e) => setDrawRole(e.target.value as TargetRole)}
            className="h-8 cursor-pointer rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-ring"
          >
            {(Object.keys(ROLE_LABELS) as TargetRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            — <span className="font-medium text-foreground">{freshAvailable}</span> inéditas disponíveis
          </span>
          <Button
            type="button"
            size="sm"
            disabled={isPending || freshAvailable === 0}
            onClick={handleRandom}
            className="ml-auto gap-1.5"
          >
            <Shuffle className="size-3.5" />
            Sortear
          </Button>
        </div>

        {/* Question list */}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {visibleQuestions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todas as perguntas ativas já foram adicionadas.
            </p>
          )}
          {visibleQuestions.map((q) => {
            const isFresh = freshSet.has(q.id);
            return (
              <div
                key={q.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors",
                  isFresh ? "border-emerald-200 bg-emerald-500/5" : "bg-muted/20"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 text-sm leading-snug">{q.question_text}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
                    {isFresh && (
                      <span className="text-xs font-medium text-emerald-600">
                        inédita
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleAdd(q.id)}
                  className="shrink-0"
                >
                  Adicionar
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
