import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Brain,
  CheckCircle2,
  HelpCircle,
  Award,
  Sparkles,
  Lightbulb,
  ClipboardCheck,
  Stethoscope,
} from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | Quiz Saúde Igarassu",
};

// Decorative quiz-themed watermark icons scattered across the background.
const WATERMARKS = [
  { Icon: HelpCircle, className: "left-[6%] top-[10%] size-24 -rotate-12" },
  { Icon: Brain, className: "right-[8%] top-[16%] size-28 rotate-12" },
  { Icon: CheckCircle2, className: "left-[12%] bottom-[14%] size-20 rotate-6" },
  { Icon: Award, className: "right-[10%] bottom-[12%] size-24 -rotate-6" },
  { Icon: Sparkles, className: "left-[44%] top-[6%] size-16 rotate-3" },
  { Icon: Lightbulb, className: "right-[40%] bottom-[8%] size-20 -rotate-12" },
  { Icon: ClipboardCheck, className: "left-[2%] top-[46%] size-16 rotate-12" },
  { Icon: Stethoscope, className: "right-[3%] top-[48%] size-20 -rotate-6" },
] as const;

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-primary/5 to-background p-4">
      {/* Quiz watermark layer */}
      <div className="pointer-events-none absolute inset-0 select-none text-primary/[0.07]">
        {WATERMARKS.map(({ Icon, className }, i) => (
          <Icon key={i} className={`absolute ${className}`} strokeWidth={1.5} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo-mark.png"
            alt="Prefeitura de Igarassu"
            width={96}
            height={96}
            className="mb-4 size-24 object-contain drop-shadow-lg"
            priority
          />
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

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
