import Link from "next/link";
import { Trophy, ArrowRight, Clock3, PlayCircle, Timer } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buildRanking, periodRange, type RankingEntry } from "@/lib/ranking";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const podiumConfig = {
  1: {
    order: 2,
    stageH: "h-24",
    stageGradient: "bg-gradient-to-b from-amber-500 to-amber-100",
    stageText: "text-amber-900",
    medalBg: "bg-amber-500",
    medalText: "text-white",
    avatarRing: "ring-2 ring-amber-400 ring-offset-2",
    avatarSize: "size-14",
    avatarText: "text-base",
    labelColor: "text-amber-600",
  },
  2: {
    order: 1,
    stageH: "h-16",
    stageGradient: "bg-gradient-to-b from-slate-400 to-slate-100",
    stageText: "text-slate-700",
    medalBg: "bg-slate-400",
    medalText: "text-white",
    avatarRing: "",
    avatarSize: "size-10",
    avatarText: "text-sm",
    labelColor: "text-slate-500",
  },
  3: {
    order: 3,
    stageH: "h-12",
    stageGradient: "bg-gradient-to-b from-orange-400 to-orange-100",
    stageText: "text-orange-900",
    medalBg: "bg-orange-400",
    medalText: "text-white",
    avatarRing: "",
    avatarSize: "size-10",
    avatarText: "text-sm",
    labelColor: "text-orange-500",
  },
} as const;

const PERIODS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
] as const;

type Period = "semanal" | "mensal" | "anual";

async function fetchRanking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  periodo: Period
): Promise<RankingEntry[]> {
  const { start, end } = periodRange(periodo);

  const query = supabase
    .from("quiz_attempts")
    .select("user_id, total_score, started_at, finished_at, profiles(full_name, avatar_url)")
    .eq("status", "completed");

  const { data } =
    periodo === "semanal"
      ? await query.eq("week_start", start)
      : await query.gte("week_start", start).lte("week_start", end);

  return buildRanking((data ?? []) as unknown as Parameters<typeof buildRanking>[0]);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const profile = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;

  const periodo = (
    PERIODS.map((p) => p.value).includes(params.periodo as Period)
      ? params.periodo
      : "semanal"
  ) as Period;

  // Fetch ranking + quiz status in parallel
  const [ranking, weekStartResult, attemptResult] = await Promise.all([
    fetchRanking(supabase, periodo),
    supabase.rpc("current_week_start"),
    // will refetch once we have weekStart
    Promise.resolve(null),
  ]);

  const weekStart = weekStartResult.data as string | null;
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
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3, 8);

  return (
    <div className="flex-1 bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Hero */}
      <div className="mx-auto max-w-xl px-4 pt-10 pb-4 text-center sm:pt-12">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
          Bem-vindo(a) ao quiz de capacitação da Secretaria de Saúde de Igarassu.
        </p>
      </div>

      {/* Podium */}
      <div className="mx-auto max-w-sm px-4 pb-6 pt-6 md:max-w-2xl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              <h2 className="font-semibold">Ranking</h2>
            </div>
            <Link
              href={`/ranking?periodo=${periodo}`}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver completo
              <ArrowRight className="size-3" />
            </Link>
          </div>
          {/* Period filter */}
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <Link
                key={p.value}
                href={`/?periodo=${p.value}`}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
                  periodo === p.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum participante ainda neste período.
          </div>
        ) : (
          <>
            {/* Podium columns */}
            <div className="flex items-end justify-center gap-2">
              {([2, 1, 3] as const).map((pos) => {
                const entry = top3[pos - 1];
                if (!entry) return null;
                const cfg = podiumConfig[pos];
                return (
                  <div
                    key={pos}
                    className="flex flex-1 flex-col items-center"
                    style={{ order: cfg.order }}
                  >
                    <div className="mb-2 flex flex-col items-center gap-1">
                      <div
                        className={`mb-1 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${cfg.medalBg} ${cfg.medalText}`}
                      >
                        {pos}
                      </div>
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
                      <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Timer className="size-2.5" />
                        {formatTime(entry.time_seconds)}
                      </p>
                    </div>
                    <div
                      className={`flex w-full items-start justify-center rounded-t-xl pt-2 font-bold shadow-inner ${cfg.stageH} ${cfg.stageGradient} ${cfg.stageText}`}
                    >
                      {pos}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest */}
            {rest.length > 0 && (
              <div className="mt-1 rounded-b-2xl border border-t-0 bg-card">
                <ul className="divide-y">
                  {rest.map((entry, i) => {
                    const pos = i + 4;
                    return (
                      <li key={entry.user_id} className="flex items-center gap-3 px-4 py-2.5">
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
                        <span className="flex-1 truncate text-sm font-medium">{entry.name}</span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-semibold tabular-nums">
                            {entry.score} pts
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Timer className="size-2.5" />
                            {formatTime(entry.time_seconds)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {quizStatus !== "concluido" && (
        <Link
          href="/quiz"
          className="fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-primary/40 sm:right-6"
        >
          <PlayCircle className="size-5" />
          {quizStatus === "andamento" ? "Continuar quiz" : "Iniciar quiz"}
        </Link>
      )}
    </div>
  );
}
