"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuestionFormDialog({ question, questionAnswer, categories, open: controlledOpen, onOpenChange: controlledOnOpenChange }: Props) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
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
  const [targetRole, setTargetRole] = useState<string>(question?.target_role ?? "ambos");

  // Reset controlled state when dialog opens for this specific question
  useEffect(() => {
    if (open) {
      setDifficulty(question?.difficulty ?? "facil");
      setCorrectOption(questionAnswer?.correct_option ?? "a");
      setCategoryId(question?.category_id ?? NONE_CATEGORY);
      setActive(question?.active ?? true);
      setTargetRole(question?.target_role ?? "ambos");
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
      {!isControlled && (question ? (
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
      ))}

      <DialogContent className="gap-0 p-0 sm:max-w-3xl">
        <form action={formAction} className="flex max-h-[88vh] flex-col">
          {/* Hidden inputs for Radix-controlled components */}
          <input type="hidden" name="difficulty" value={difficulty} />
          <input type="hidden" name="correct_option" value={correctOption} />
          <input
            type="hidden"
            name="category_id"
            value={categoryId === NONE_CATEGORY ? "" : categoryId}
          />
          {active && <input type="hidden" name="active" value="on" />}
          <input type="hidden" name="target_role" value={targetRole} />

          <DialogHeader className="space-y-0 border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                {question ? (
                  <Pencil className="size-5" />
                ) : (
                  <Plus className="size-5" />
                )}
              </div>
              <div className="space-y-0.5 text-left">
                <DialogTitle className="text-lg">
                  {question ? "Editar pergunta" : "Nova pergunta"}
                </DialogTitle>
                <DialogDescription>
                  Preencha todos os campos obrigatórios.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="question_text" className="text-sm font-semibold">
                Pergunta
              </Label>
              <Textarea
                id="question_text"
                name="question_text"
                defaultValue={question?.question_text}
                rows={3}
                required
                className="resize-none text-base"
                placeholder="Digite o enunciado da pergunta..."
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-sm font-semibold">
                Alternativas
                <span className="ml-1.5 font-normal text-muted-foreground">
                  — a correta fica destacada
                </span>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["a", "b", "c", "d"] as Option[]).map((opt) => {
                  const isCorrect = correctOption === opt;
                  return (
                    <div
                      key={opt}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border bg-card p-2.5 transition-colors",
                        isCorrect
                          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                          : "border-border"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrectOption(opt)}
                        aria-label={`Marcar opção ${opt.toUpperCase()} como correta`}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold uppercase transition-colors",
                          isCorrect
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        )}
                      >
                        {opt}
                      </button>
                      <Input
                        id={`option_${opt}`}
                        name={`option_${opt}`}
                        defaultValue={
                          question?.[`option_${opt}` as keyof Question] as string
                        }
                        required
                        placeholder={`Opção ${opt.toUpperCase()}`}
                        className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Resposta correta</Label>
                <Select
                  value={correctOption}
                  onValueChange={(v) => setCorrectOption(v as Option)}
                >
                  <SelectTrigger className="w-full bg-card">
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
                <Label className="text-sm font-semibold">Dificuldade</Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as Difficulty)}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full bg-card">
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
                <Label htmlFor="time_limit_seconds" className="text-sm font-semibold">
                  Tempo limite (s)
                </Label>
                <Input
                  id="time_limit_seconds"
                  name="time_limit_seconds"
                  type="number"
                  min="1"
                  defaultValue={question?.time_limit_seconds ?? 60}
                  required
                  className="bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Para qual função</Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambos">Todos</SelectItem>
                    <SelectItem value="tecnico">Técnico de Enfermagem</SelectItem>
                    <SelectItem value="enfermeira">Enfermeira(o)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source" className="text-sm font-semibold">
                Fonte
                <span className="ml-1.5 font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="source"
                name="source"
                defaultValue={question?.source ?? ""}
                placeholder="Ex: Manual de Enfermagem, Cap. 3"
                className="bg-card"
              />
            </div>

            <label
              htmlFor="active_check"
              className="flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors hover:bg-muted/40"
            >
              <Checkbox
                id="active_check"
                checked={active}
                onCheckedChange={(v) => setActive(!!v)}
              />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">Pergunta ativa</p>
                <p className="text-xs text-muted-foreground">
                  Perguntas inativas não entram nos quizzes.
                </p>
              </div>
            </label>

            {state?.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-t bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
