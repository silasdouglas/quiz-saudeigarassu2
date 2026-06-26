import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Brain, CheckCircle2, Award, Stethoscope } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | Quiz Saúde Igarassu",
};

const FEATURES = [
  "Questões semanais de enfermagem e saúde pública",
  "Ranking e acompanhamento de desempenho",
  "Conteúdo validado pela Secretaria de Saúde",
] as const;

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — hidden on mobile, visible lg+ */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-primary p-12">
        {/* Decorative faded icons */}
        <div className="pointer-events-none absolute inset-0 select-none text-white/10">
          <Brain className="absolute left-[8%] top-[12%] size-48 -rotate-12" strokeWidth={1} />
          <Stethoscope className="absolute right-[6%] bottom-[18%] size-56 rotate-6" strokeWidth={1} />
          <Award className="absolute left-[50%] bottom-[8%] size-36 -rotate-6" strokeWidth={1} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-mark.png"
              alt="Prefeitura de Igarassu"
              width={64}
              height={64}
              className="size-16 object-contain"
              priority
            />
            <span className="text-xl font-bold text-white">Quiz Saúde Igarassu</span>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Capacitação contínua para profissionais de saúde de Igarassu
            </h2>
          </div>

          <ul className="mt-4 flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-white" strokeWidth={2} />
                <span className="text-white/90">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — form side */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo — mobile only */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Image
              src="/logo-mark.png"
              alt="Prefeitura de Igarassu"
              width={72}
              height={72}
              className="size-18 object-contain"
              priority
            />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo(a) de volta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5">
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
