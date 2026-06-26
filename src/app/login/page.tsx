import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Award, Stethoscope, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | Quiz Saúde Igarassu",
};

const FEATURES = [
  "Questões semanais de enfermagem e saúde pública",
  "Ranking e acompanhamento de desempenho",
  "Conteúdo validado pela Secretaria de Saúde",
] as const;

const STATS = [
  { value: "90+", label: "Perguntas" },
  { value: "Semanal", label: "Novos quizzes" },
  { value: "Ranking", label: "Em tempo real" },
] as const;

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — hidden on mobile, visible lg+ */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-emerald-700 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        {/* Animated color blobs */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="animate-login-blob absolute -left-20 top-[-10%] size-80 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="animate-login-blob absolute right-[-10%] top-[30%] size-96 rounded-full bg-teal-200/20 blur-3xl [animation-delay:-6s]" />
          <div className="animate-login-blob absolute bottom-[-15%] left-[30%] size-72 rounded-full bg-lime-200/20 blur-3xl [animation-delay:-11s]" />
        </div>

        {/* Subtle grid + faded icons */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 select-none text-white/10">
          <Stethoscope className="absolute right-[6%] bottom-[16%] size-56 rotate-6" strokeWidth={1} />
          <Award className="absolute left-[6%] bottom-[10%] size-36 -rotate-6" strokeWidth={1} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 p-2 ring-1 ring-white/25 backdrop-blur-sm">
            <Image
              src="/logo-mark.png"
              alt="Prefeitura de Igarassu"
              width={56}
              height={56}
              className="size-12 object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-white">Quiz Saúde Igarassu</span>
        </div>

        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            Capacitação contínua
          </div>
          <h2 className="max-w-md text-4xl font-bold leading-tight text-white">
            Aprenda, pratique e suba no ranking da saúde de Igarassu
          </h2>

          <ul className="mt-8 flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-white" strokeWidth={2} />
                <span className="text-white/90">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm"
            >
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="mt-0.5 text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form side */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-12 lg:w-1/2">
        {/* Soft ambient glow on mobile/desktop */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute right-[-15%] top-[-10%] size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-15%] left-[-10%] size-72 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="animate-login-rise relative z-10 w-full max-w-sm">
          {/* Logo — mobile only */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 p-2 ring-1 ring-primary/15">
              <Image
                src="/logo-mark.png"
                alt="Prefeitura de Igarassu"
                width={64}
                height={64}
                className="size-16 object-contain"
                priority
              />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo(a) de volta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <div className="rounded-3xl border bg-card/80 p-6 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-7">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/cadastro" className="font-medium text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
