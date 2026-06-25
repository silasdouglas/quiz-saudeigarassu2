import Link from "next/link";
import { ArrowLeft, Timer, Trophy } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buildRanking, periodRange, type RankingEntry } from "@/lib/ranking";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const PERIODS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
] as const;

type Period = "semanal" | "mensal" | "anual";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  await requireUser();
  const supabase = await createClient();
  const params = await searchParams;

  const periodo = (
    PERIODS.map((p) => p.value).includes(params.periodo as Period)
      ? params.periodo
      : "semanal"
  ) as Period;

  const { start, end } = periodRange(periodo);

  const query = supabase
    .from("quiz_attempts")
    .select("user_id, total_score, started_at, finished_at, profiles(full_name, avatar_url)")
    .eq("status", "completed");

  const { data } =
    periodo === "semanal"
      ? await query.eq("week_start", start)
      : await query.gte("week_start", start).lte("week_start", end);

  const ranking = buildRanking((data ?? []) as unknown as Parameters<typeof buildRanking>[0]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          <h1 className="text-xl font-bold">Ranking completo</h1>
        </div>
      </div>

      {/* Period filter */}
      <div className="mb-5 flex gap-1.5">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/ranking?periodo=${p.value}`}
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

      {ranking.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Nenhum participante neste período ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <ul className="divide-y">
            {ranking.map((entry: RankingEntry, i) => {
              const pos = i + 1;
              return (
                <li
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    pos <= 3 && "bg-muted/30"
                  )}
                >
                  <span className="w-7 shrink-0 text-center text-sm font-bold">
                    {MEDAL[pos] ?? pos}
                  </span>
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.name}
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {entry.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="size-3" />
                      {formatTime(entry.time_seconds)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {entry.score} pts
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
