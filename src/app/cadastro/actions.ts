"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = { error?: string } | undefined;

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

  if (!fullName) return { error: "Informe seu nome completo." };
  if (!matricula) return { error: "Informe sua matrícula." };
  if (!funcao || !['tecnico_enfermagem', 'enfermeira'].includes(funcao)) return { error: "Selecione sua função." };
  if (!email) return { error: "Informe seu e-mail." };
  if (password.length < 6) return { error: "A senha deve ter no mínimo 6 caracteres." };
  if (password !== confirmPassword) return { error: "As senhas não coincidem." };

  const supabase = await createClient();

  // Check matricula uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("matricula", matricula)
    .maybeSingle();
  if (existing) return { error: "Esta matrícula já está cadastrada." };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, matricula, funcao },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.message?.includes("already registered")) {
      return { error: "Este e-mail já está cadastrado." };
    }
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  redirect("/");
}
