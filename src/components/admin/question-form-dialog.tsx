"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createQuestion,
  updateQuestion,
  type QuestionFormState,
} from "@/app/(app)/admin/questions/actions";
import type { Category, Difficulty, Option, Question, QuestionAnswer } from "@/lib/types";

const NONE_CATEGORY = "__none__";

interface Props {
  question?: Question;
  questionAnswer?: QuestionAnswer;
  categories: Category[];
}

export function QuestionFormDialog({ question, questionAnswer, categories }: Props) {
  const [open, setOpen] = useState(false);
  const action = question
    ? updateQuestion.bind(null, question.id)
    : createQuestion;
  const [state, formAction, pending] = useActionState<QuestionFormState, FormData>(
    action,
    undefined
  );
  const wasPending = useRef(false);

  // Controlled state for Radix components (which don't post to FormData natively)
  const [difficulty, setDifficulty] = useState<Difficulty>(
    question?.difficulty ?? "facil"
  );
  const [correctOption, setCorrectOption] = useState<Option>(
    questionAnswer?.correct_option ?? "a"
  );
  const [categoryId, setCategoryId] = useState<string>(
    question?.category_id ?? NONE_CATEGORY
  );
  const [active, setActive] = useState<boolean>(question?.active ?? true);

  // Reset controlled state when dialog opens for this specific question
  useEffect(() => {
    if (open) {
      setDifficulty(question?.difficulty ?? "facil");
      setCorrectOption(questionAnswer?.correct_option ?? "a");
      setCategoryId(question?.category_id ?? NONE_CATEGORY);
      setActive(question?.active ?? true);
    }
  }, [open, question, questionAnswer]);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      {question ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label="Editar pergunta"
        >
          <Pencil className="size-4" />
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Nova pergunta
        </Button>
      )}

      <DialogContent className="max-w-2xl">
        <form action={formAction}>
          {/* Hidden inputs for Radix-controlled components */}
          <input type="hidden" name="difficulty" value={difficulty} />
          <input type="hidden" name="correct_option" value={correctOption} />
          <input
            type="hidden"
            name="category_id"
            value={categoryId === NONE_CATEGORY ? "" : categoryId}
          />
          {active && <input type="hidden" name="active" value="on" />}

          <DialogHeader>
            <DialogTitle>
              {question ? "Editar pergunta" : "Nova pergunta"}
            </DialogTitle>
            <DialogDescription>
              Preencha todos os campos obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto py-4 pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="question_text">Pergunta</Label>
              <Textarea
                id="question_text"
                name="question_text"
                defaultValue={question?.question_text}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["a", "b", "c", "d"] as Option[]).map((opt) => (
                <div key={opt} className="space-y-1.5">
                  <Label htmlFor={`option_${opt}`}>
                    Opção {opt.toUpperCase()}
                  </Label>
                  <Input
                    id={`option_${opt}`}
                    name={`option_${opt}`}
                    defaultValue={
                      question?.[`option_${opt}` as keyof Question] as string
                    }
                    required
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Resposta correta</Label>
                <Select
                  value={correctOption}
                  onValueChange={(v) => setCorrectOption(v as Option)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["a", "b", "c", "d"] as Option[]).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        Opção {opt.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Dificuldade</Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as Difficulty)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_CATEGORY}>Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="time_limit_seconds">Tempo limite (s)</Label>
                <Input
                  id="time_limit_seconds"
                  name="time_limit_seconds"
                  type="number"
                  min="1"
                  defaultValue={question?.time_limit_seconds ?? 60}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="active_check"
                checked={active}
                onCheckedChange={(v) => setActive(!!v)}
              />
              <Label htmlFor="active_check">Pergunta ativa</Label>
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
