"use client";

import { useCallback, useTransition, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/lib/ranking";
import { fetchRankingAction } from "@/app/(app)/ranking-action";
import { useRealtimeTable } from "@/lib/hooks/use-realtime";

type Period = "semanal" | "mensal" | "anual";

const PERIODS: { value: Period; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
];

type Funcao = "all" | "tecnico" | "enfermeira";

const FUNCOES: { value: Funcao; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "tecnico", label: "Técnicos" },
  { value: "enfermeira", label: "Enfermeiras" },
];

const podiumConfig = {
  1: {
    order: 2,
    stageH: "h-24",
    stageGradient: "bg-gradient-to-b from-amber-200 to-amber-50",
    stageText: "text-amber-700",
    medalBg: "bg-amber-400",
    medalText: "text-white",
    avatarRing: "ring-2 ring-amber-300 ring-offset-2",
    avatarSize: "size-14",
    avatarText: "text-base",
    labelColor: "text-amber-500",
  },
  2: {
    order: 1,
    stageH: "h-16",
    stageGradient: "bg-gradient-to-b from-zinc-200 to-zinc-50",
    stageText: "text-zinc-500",
    medalBg: "bg-zinc-400",
    medalText: "text-white",
    avatarRing: "",
    avatarSize: "size-10",
    avatarText: "text-sm",
    labelColor: "text-zinc-400",
  },
  3: {
    order: 3,
    stageH: "h-12",
    stageGradient: "bg-gradient-to-b from-orange-200 to-orange-50",
    stageText: "text-orange-600",
    medalBg: "bg-orange-300",
    medalText: "text-white",
    avatarRing: "",
    avatarSize: "size-10",
    avatarText: "text-sm",
    labelColor: "text-orange-400",
  },
} as const;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function RankingSection({
  initialRanking,
  initialPeriodo,
}: {
  initialRanking: RankingEntry[];
  initialPeriodo: Period;
}) {
  const [periodo, setPeriodo] = useState<Period>(initialPeriodo);
  const [ranking, setRanking] = useState<RankingEntry[]>(initialRanking);
  const [funcao, setFuncao] = useState<Funcao>("all");
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const data = await fetchRankingAction(periodo, funcao);
      setRanking(data);
    });
  }, [periodo, funcao]);

  useRealtimeTable("quiz_attempts", refresh, "status=eq.completed");

  function switchPeriodo(p: Period) {
    if (p === periodo) return;
    startTransition(async () => {
      const data = await fetchRankingAction(p, funcao);
      setRanking(data);
      setPeriodo(p);
    });
  }

  function switchFuncao(f: Funcao) {
    if (f === funcao) return;
    startTransition(async () => {
      const data = await fetchRankingAction(periodo, f);
      setRanking(data);
      setFuncao(f);
    });
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3, 8);

  return (
    <div className="mx-auto max-w-sm px-4 pb-6 pt-6 md:max-w-2xl">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <h2 className="font-semibold">Ranking</h2>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          </div>
          <Link
            href={`/ranking?periodo=${periodo}`}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver completo
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => switchPeriodo(p.value)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
                periodo === p.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
                isPending && "opacity-60"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {FUNCOES.map((f) => (
            <button
              key={f.value}
              onClick={() => switchFuncao(f.value)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
                funcao === f.value
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
                isPending && "opacity-60"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("transition-opacity duration-150", isPending && "opacity-50")}>
        {ranking.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum participante ainda neste período.
          </div>
        ) : (
          <>
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
                          <span className="text-xs font-semibold tabular-nums">{entry.score} pts</span>
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
    </div>
  );
}
