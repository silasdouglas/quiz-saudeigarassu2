import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Cadastre-se | Quiz Saúde Igarassu",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Stethoscope className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            Quiz de capacitação da Secretaria de Saúde de Igarassu
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5">
          <RegisterForm />
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
