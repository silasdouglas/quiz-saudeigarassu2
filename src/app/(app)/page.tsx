import Link from "next/link";
import { Trophy, ArrowRight, Clock3, PlayCircle } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const MOCK_RANKING = [
  { name: "Maria Santos", score: 145, avatar_url: null },
  { name: "João Silva", score: 132, avatar_url: null },
  { name: "Ana Oliveira", score: 128, avatar_url: null },
  { name: "Carlos Lima", score: 115, avatar_url: null },
  { name: "Fernanda Costa", score: 98, avatar_url: null },
];

const podiumConfig = {
  1: {
    order: 2,
    stageH: "h-24",
    stageGradient: "bg-gradient-to-b from-amber-300 to-yellow-500",
    stageText: "text-amber-950",
    medalBg: "bg-amber-400",
    medalText: "text-amber-950",
    avatarRing: "ring-2 ring-amber-400 ring-offset-2",
    avatarSize: "size-14",
    avatarText: "text-base",
    labelColor: "text-amber-600",
  },
  2: {
    order: 1,
    stageH: "h-16",
    stageGradient: "bg-gradient-to-b from-slate-200 to-slate-400",
    stageText: "text-slate-700",
    medalBg: "bg-slate-300",
    medalText: "text-slate-700",
    avatarRing: "",
    avatarSize: "size-10",
    avatarText: "text-sm",
    labelColor: "text-slate-500",
  },
  3: {
    order: 3,
    stageH: "h-12",
    stageGradient: "bg-gradient-to-b from-orange-200 to-orange-400",
    stageText: "text-orange-900",
    medalBg: "bg-orange-300",
    medalText: "text-orange-900",
    avatarRing: "",
    avatarSize: "size-10",
    avatarText: "text-sm",
    labelColor: "text-orange-500",
  },
} as const;

export default async function HomePage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: weekStartRow } = await supabase.rpc("current_week_start");
  const weekStart = weekStartRow as string | null;

  const { data: attempt } = weekStart
    ? await supabase
        .from("quiz_attempts")
        .select("status, total_score")
        .eq("user_id", profile.id)
        .eq("week_start", weekStart)
        .maybeSingle()
    : { data: null };

  const quizStatus = !attempt
    ? "disponivel"
    : attempt.status === "completed"
      ? "concluido"
      : "andamento";

  const firstName = profile.full_name.split(" ")[0];

  const top3 = MOCK_RANKING.slice(0, 3);
  const rest = MOCK_RANKING.slice(3);

  return (
    <div className="flex-1 bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Hero */}
      <div className="mx-auto max-w-xl px-4 pt-10 pb-4 text-center sm:pt-12">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
          <Clock3 className="size-3.5" />
          <span>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Olá, {firstName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Bem-vindo(a) ao quiz de capacitação da Secretaria de Saúde de
          Igarassu.
        </p>
      </div>

      {/* Podium */}
      <div className="mx-auto max-w-sm px-4 pt-6 pb-4">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <h2 className="font-semibold">Ranking da semana</h2>
          </div>
          <Link
            href="/ranking"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver completo
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Podium columns — ordered [2, 1, 3] visually */}
        <div className="flex items-end justify-center gap-2">
          {([2, 1, 3] as const).map((pos) => {
            const entry = top3[pos - 1];
            const cfg = podiumConfig[pos];
            return (
              <div
                key={pos}
                className="flex flex-1 flex-col items-center"
                style={{ order: cfg.order }}
              >
                {/* Info above stage */}
                <div className="mb-2 flex flex-col items-center gap-1">
                  {/* Medal badge */}
                  <div
                    className={`mb-1 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${cfg.medalBg} ${cfg.medalText}`}
                  >
                    {pos}
                  </div>
                  {/* Avatar */}
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.name}
                      className={`shrink-0 rounded-full object-cover ${cfg.avatarSize} ${cfg.avatarRing}`}
                    />
                  ) : (
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ${cfg.avatarSize} ${cfg.avatarText} ${cfg.avatarRing}`}
                    >
                      {entry.name.charAt(0)}
                    </div>
                  )}
                  <p className="max-w-full truncate text-center text-xs font-semibold leading-tight">
                    {entry.name.split(" ")[0]}
                  </p>
                  <p className={`text-xs font-bold ${cfg.labelColor}`}>
                    {entry.score} pts
                  </p>
                </div>
                {/* Stage with gradient */}
                <div
                  className={`flex w-full items-start justify-center rounded-t-xl pt-2 font-bold shadow-inner ${cfg.stageH} ${cfg.stageGradient} ${cfg.stageText}`}
                >
                  {pos}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of ranking */}
        {rest.length > 0 && (
          <div className="mt-1 rounded-b-2xl border border-t-0 bg-card">
            <ul className="divide-y">
              {rest.map((entry, i) => {
                const pos = i + 4;
                return (
                  <li
                    key={entry.name}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {pos}
                    </span>
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.name}
                        className="size-7 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {entry.name.charAt(0)}
                      </div>
                    )}
                    <span className="flex-1 truncate text-sm font-medium">
                      {entry.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      {entry.score} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* FAB — start quiz */}
      {quizStatus !== "concluido" && (
        <Link
          href="/quiz"
          className="fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-primary/40 sm:right-6"
        >
          <PlayCircle className="size-5" />
          {quizStatus === "andamento" ? "Continuar quiz" : "Iniciar quiz"}
        </Link>
      )}
    </div>
  );
}
