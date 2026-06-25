import Link from "next/link";
import {
  HelpCircle,
  PlayCircle,
  Trophy,
  Clock,
  ShieldAlert,
  Award,
  UserCog,
  Mail,
} from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const SCORING = [
  { label: "Fácil", points: 5, className: "bg-emerald-500/10 text-emerald-600" },
  { label: "Média", points: 10, className: "bg-amber-500/10 text-amber-600" },
  { label: "Difícil", points: 15, className: "bg-red-500/10 text-red-600" },
];

export default async function HelpPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("quiz_settings")
    .select("tab_switch_penalty_points, max_tab_switches")
    .single();

  const penalty = settings?.tab_switch_penalty_points ?? 5;
  const maxSwitches = settings?.max_tab_switches ?? 3;
  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <HelpCircle className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de ajuda</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tudo o que você precisa saber sobre o quiz de capacitação.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Como funciona */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <PlayCircle className="size-5 text-primary" />
            <h2 className="font-semibold">Como funciona o quiz</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Toda semana um novo quiz é disponibilizado com um conjunto de
            perguntas de múltipla escolha. Você tem{" "}
            <strong className="text-foreground">uma tentativa por semana</strong>
            . Comece pela página inicial ou pelo menu{" "}
            <Link href="/quiz" className="text-primary hover:underline">
              Quiz
            </Link>
            , leia as instruções e clique em <em>Iniciar quiz</em>. Cada pergunta
            aparece individualmente e, ao terminar, sua pontuação entra no
            ranking.
          </p>
        </section>

        {/* Pontuação */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Award className="size-5 text-primary" />
            <h2 className="font-semibold">Pontuação</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Cada pergunta vale pontos conforme a dificuldade. Respostas erradas
            não descontam pontos.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SCORING.map((s) => (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 ${s.className}`}
              >
                <span className="text-2xl font-bold">{s.points}</span>
                <span className="text-xs font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tempo */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            <h2 className="font-semibold">Tempo</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cada pergunta tem seu próprio cronômetro. Responder mais rápido
            melhora sua posição: em caso de empate na pontuação, vence quem levou{" "}
            <strong className="text-foreground">menos tempo total</strong>.
          </p>
        </section>

        {/* Penalidade de aba */}
        <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" />
            <h2 className="font-semibold text-destructive">
              Não saia da aba durante o quiz
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Trocar de aba ou minimizar a janela durante o quiz aplica uma
            penalidade de{" "}
            <strong className="text-foreground">{penalty} pontos</strong> por
            troca. Após{" "}
            <strong className="text-foreground">{maxSwitches} trocas</strong>, o
            quiz é encerrado automaticamente e a pontuação do momento é
            registrada.
          </p>
        </section>

        {/* Ranking */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <h2 className="font-semibold">Ranking</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            O ranking pode ser visto por período:{" "}
            <strong className="text-foreground">semanal</strong>,{" "}
            <strong className="text-foreground">mensal</strong> e{" "}
            <strong className="text-foreground">anual</strong>. Nos períodos
            mensal e anual as pontuações de cada semana são somadas. Veja o
            ranking completo em{" "}
            <Link href="/ranking" className="text-primary hover:underline">
              Ranking
            </Link>
            .
          </p>
        </section>

        {/* Conta */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <UserCog className="size-5 text-primary" />
            <h2 className="font-semibold">Perfil e conta</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Em{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Configurações
            </Link>{" "}
            você pode trocar sua foto de perfil, alterar a senha e conferir os
            dados da sua conta.
          </p>
        </section>

        {/* Admin */}
        {isAdmin && (
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              <h2 className="font-semibold">Administração</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              No{" "}
              <Link href="/admin" className="text-primary hover:underline">
                painel administrativo
              </Link>{" "}
              você gerencia perguntas, categorias, o agendamento semanal e as
              configurações gerais. Como administrador, você pode refazer o quiz
              quantas vezes quiser para testá-lo — essas tentativas{" "}
              <strong className="text-foreground">não entram no ranking</strong>.
            </p>
          </section>
        )}

        {/* Suporte */}
        <section className="rounded-2xl border border-dashed p-6 text-center">
          <Mail className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Ainda com dúvidas? Procure a equipe da Secretaria de Saúde de
            Igarassu responsável pela capacitação.
          </p>
        </section>
      </div>
    </div>
  );
}
