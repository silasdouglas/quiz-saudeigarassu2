"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuestionFormDialog } from "@/components/admin/question-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import type { Category, Question, QuestionAnswer } from "@/lib/types";

interface Props {
  question: Question;
  questionAnswer?: QuestionAnswer;
  categories: Category[];
  removeAction: () => Promise<void>;
}

export function ScheduleRowActions({ question, questionAnswer, categories, removeAction }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Ações">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <QuestionFormDialog
        question={question}
        questionAnswer={questionAnswer}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmDeleteButton
        itemLabel="a pergunta do agendamento"
        action={removeAction}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
