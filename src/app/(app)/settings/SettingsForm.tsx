"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, KeyRound, Eye, EyeOff, User } from "lucide-react";
import { updateAvatar, updatePassword, updateProfile } from "./actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type AvatarState = { error?: string; success?: boolean };
type PasswordState = { error?: string; success?: boolean };
type ProfileState = { error?: string; emailPending?: boolean; success?: boolean };
type Section = "conta" | "seguranca";

const SECTIONS: { value: Section; label: string; icon: React.ReactNode }[] = [
  { value: "conta", label: "Minha conta", icon: <User className="size-4" /> },
  { value: "seguranca", label: "Segurança", icon: <KeyRound className="size-4" /> },
];

export function SettingsForm({
  profile,
  defaultSection = "conta",
}: {
  profile: Profile;
  defaultSection?: string;
}) {
  const validSection = SECTIONS.some((s) => s.value === defaultSection)
    ? (defaultSection as Section)
    : "conta";
  const [section, setSection] = useState<Section>(validSection);

  const [avatarState, avatarAction, avatarPending] = useActionState<AvatarState, FormData>(
    async (_prev, formData) => {
      const result = await updateAvatar(formData);
      if (!result.error) return { success: true };
      return result;
    },
    {}
  );

  const [passwordState, passwordAction, passwordPending] = useActionState<PasswordState, FormData>(
    async (_prev, formData) => {
      const result = await updatePassword(formData);
      if (!result.error) return { success: true };
      return result;
    },
    {}
  );

  const [profileState, profileAction, profilePending] = useActionState<ProfileState, FormData>(
    async (_prev, formData) => {
      const result = await updateProfile(formData);
      if (!result.error && !result.emailPending) return { success: true };
      return result;
    },
    {}
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Imagem muito grande. Escolha um arquivo com até 5 MB.");
      setPreview(null);
      e.target.value = "";
      return;
    }
    setFileError(null);
    setPreview(URL.createObjectURL(file));
  }

  const avatarSrc = preview ?? profile.avatar_url ?? null;
  const initial = profile.full_name.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie seu perfil e segurança.</p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {/* ── Sidebar nav ──────────────────────────────────────────────── */}
        <nav className="flex shrink-0 flex-row gap-1 sm:w-44 sm:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSection(s.value)}
              className={cn(
                "flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium sm:flex-none",
                section === s.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 rounded-xl border bg-card p-6">

          {/* ── MINHA CONTA ──────────────────────────────────────────── */}
          {section === "conta" && (
            <div className="space-y-8">
            <form action={avatarAction} className="space-y-5">
              <h2 className="font-semibold">Foto de perfil</h2>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
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
                    className="absolute bottom-0 right-0 flex size-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                    aria-label="Alterar foto"
                  >
                    <Camera className="size-3.5" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
                  <p className="text-sm font-medium">Escolher imagem</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP ou HEIC. Máximo 5 MB.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 w-fit cursor-pointer self-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent sm:self-start"
                  >
                    Escolher foto
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                name="avatar"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                className="sr-only"
                onChange={handleFileChange}
              />

              {(fileError ?? avatarState?.error) && (
                <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {fileError ?? avatarState?.error}
                </p>
              )}
              {avatarState?.success && !avatarState?.error && (
                <p className="rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
                  Foto atualizada com sucesso!
                </p>
              )}

              <button
                type="submit"
                disabled={avatarPending || !preview || !!fileError}
                className="w-full cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {avatarPending ? "Salvando..." : "Salvar foto"}
              </button>
            </form>

            <form action={profileAction} className="space-y-4 border-t pt-6">
              <h2 className="font-semibold">Dados da conta</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nome completo
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    defaultValue={profile.full_name}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    E-mail
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={profile.email}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Perfil
                  </label>
                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                    {profile.role === "admin" ? "Administrador" : "Usuário"}
                  </div>
                </div>
              </div>

              {profileState?.emailPending && (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                  Confirmação enviada para o novo e-mail. Verifique sua caixa de entrada.
                </p>
              )}
              {profileState?.error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {profileState.error}
                </p>
              )}
              {profileState?.success && !profileState?.error && (
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                  Dados atualizados com sucesso!
                </p>
              )}

              <button
                type="submit"
                disabled={profilePending}
                className="w-full cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {profilePending ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
            </div>
          )}

          {/* ── SEGURANÇA ────────────────────────────────────────────── */}
          {section === "seguranca" && (
            <form action={passwordAction} className="space-y-4">
              <h2 className="font-semibold">Segurança</h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">Senha atual</label>
                <div className="relative">
                  <input
                    name="current_password"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 pr-9 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">Nova senha</label>
                <div className="relative">
                  <input
                    name="new_password"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 pr-9 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    name="confirm_password"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 pr-9 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              {passwordState?.error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {passwordState.error}
                </p>
              )}
              {passwordState?.success && !passwordState?.error && (
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                  Senha alterada com sucesso!
                </p>
              )}

              <button
                type="submit"
                disabled={passwordPending}
                className="w-full cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordPending ? "Alterando..." : "Alterar senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
