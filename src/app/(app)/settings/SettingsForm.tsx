"use client";

import { useActionState, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { updateAvatar } from "./actions";
import type { Profile } from "@/lib/types";

type FormState = { error?: string; success?: boolean };

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await updateAvatar(formData);
      if (!result.error) return { success: true };
      return result;
    },
    {}
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  const avatarSrc = preview ?? profile.avatar_url ?? null;
  const initial = profile.full_name.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-lg px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu perfil e foto.
        </p>
      </div>

      {/* Avatar section */}
      <form action={formAction} className="space-y-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar preview */}
          <div className="relative shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Foto de perfil"
                className="size-24 rounded-full object-cover ring-2 ring-primary/20 ring-offset-2"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary ring-2 ring-primary/20 ring-offset-2">
                {initial}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              aria-label="Alterar foto"
            >
              <Camera className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
            <p className="text-sm font-medium">Foto de perfil</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP. Máximo 2 MB.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 w-fit self-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors sm:self-start"
            >
              Escolher foto
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
        />

        {state?.error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state?.success && !state?.error && (
          <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-700 dark:text-green-400">
            Foto atualizada com sucesso!
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !preview}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Salvando..." : "Salvar foto"}
        </button>
      </form>

      {/* Profile info (read-only) */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Informações do perfil
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Nome completo
            </label>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              {profile.full_name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              E-mail
            </label>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              {profile.email}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Perfil
            </label>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm capitalize">
              {profile.role === "admin" ? "Administrador" : "Usuário"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
