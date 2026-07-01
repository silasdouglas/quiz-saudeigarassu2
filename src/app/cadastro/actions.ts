"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterField =
  | "full_name"
  | "matricula"
  | "funcao"
  | "email"
  | "password"
  | "confirm_password";

export type RegisterState =
  | { error?: string; field?: RegisterField }
  | undefined;

export async function register(
  _state: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const matricula = String(formData.get("matricula") ?? "").trim();
  const funcao = String(formData.get("funcao") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!fullName) return { error: "Informe seu nome completo.", field: "full_name" };
  if (!matricula) return { error: "Informe sua matrícula.", field: "matricula" };
  if (!funcao || !['tecnico', 'enfermeira'].includes(funcao)) return { error: "Selecione sua função.", field: "funcao" };
  if (!email) return { error: "Informe seu e-mail.", field: "email" };
  if (password.length < 6) return { error: "A senha deve ter no mínimo 6 caracteres.", field: "password" };
  if (password !== confirmPassword) return { error: "As senhas não coincidem.", field: "confirm_password" };

  // Use service role to bypass RLS for uniqueness checks
  const admin = createAdminClient();

  const { data: existingMatricula } = await admin
    .from("profiles")
    .select("id")
    .eq("matricula", matricula)
    .limit(1);
  if (existingMatricula && existingMatricula.length > 0)
    return { error: "Esta matrícula já está cadastrada.", field: "matricula" };

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, matricula, funcao },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.message?.includes("already registered")) {
      return { error: "Este e-mail já está cadastrado.", field: "email" };
    }
    const { data: matriculaTakenNow } = await admin
      .from("profiles")
      .select("id")
      .eq("matricula", matricula)
      .limit(1);
    if (matriculaTakenNow && matriculaTakenNow.length > 0)
      return { error: "Esta matrícula já está cadastrada.", field: "matricula" };
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  // Sign out so the user must log in manually
  await supabase.auth.signOut();

  redirect("/login?cadastro=ok");
}
