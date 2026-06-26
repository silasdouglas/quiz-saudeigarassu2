"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetAttempt } from "@/app/(app)/admin/attempts/actions";

export function ResetAttemptButton({
  attemptId,
  userName,
}: {
  attemptId: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label="Permitir refazer o quiz"
      >
        <RotateCcw className="size-4 text-amber-600" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liberar nova tentativa?</DialogTitle>
          <DialogDescription>
            A tentativa de <strong>{userName}</strong> e todas as respostas
            serão apagadas. O usuário poderá refazer o quiz desta semana do
            zero. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await resetAttempt(attemptId);
                  toast.success("Tentativa liberada. O usuário pode refazer o quiz.");
                  setOpen(false);
                } catch {
                  toast.error("Erro ao liberar a tentativa.");
                }
              })
            }
          >
            Liberar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
