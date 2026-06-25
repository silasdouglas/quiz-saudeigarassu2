"use client";

import { useActionState } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { register } from "@/app/cadastro/actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="full_name">
          Nome completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          placeholder="Maria da Silva"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="matricula">
          Matrícula
        </label>
        <input
          id="matricula"
          name="matricula"
          type="text"
          required
          placeholder="000000"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seuemail@igarassu.pe.gov.br"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="password">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Mínimo 6 caracteres"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="confirm_password">
          Confirmar senha
        </label>
        <div className="relative">
          <input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Repita a senha"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Criando conta…" : "Cadastrar"}
      </button>
    </form>
  );
}
