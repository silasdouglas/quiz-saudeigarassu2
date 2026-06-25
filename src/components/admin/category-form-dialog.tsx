"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCategory,
  updateCategory,
  type CategoryFormState,
} from "@/app/(app)/admin/categories/actions";
import type { Category } from "@/lib/types";

export function CategoryFormDialog({ category }: { category?: Category }) {
  const [open, setOpen] = useState(false);
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;
  const [state, formAction, pending] = useActionState<
    CategoryFormState,
    FormData
  >(action, undefined);
  const wasPending = useRef(false);

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
      {category ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label="Editar categoria"
        >
          <Pencil className="size-4" />
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Nova categoria
        </Button>
      )}
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>
              {category ? "Editar categoria" : "Nova categoria"}
            </DialogTitle>
            <DialogDescription>
              Categorias agrupam as perguntas do quiz por tema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                defaultValue={category?.name}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={category?.description}
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
