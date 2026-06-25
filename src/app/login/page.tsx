import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | Quiz Saúde Igarassu",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Stethoscope className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz Saúde Igarassu</h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
            Capacitação para enfermeiros e técnicos de enfermagem da Prefeitura
            de Igarassu
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
