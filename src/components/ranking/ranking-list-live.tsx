"use client";

import { useCallback, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/lib/ranking";
import { fetchFullRankingAction } from "@/app/(app)/ranking/actions";
import { useRealtimeTable } from "@/lib/hooks/use-realtime";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function RankingListLive({
  initialRanking,
}: {
  initialRanking: RankingEntry[];
}) {
  const searchParams = useSearchParams();
  const [ranking, setRanking] = useState(initialRanking);
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    const periodo = searchParams.get("periodo") ?? "semanal";
    const funcao = searchParams.get("funcao") ?? "all";
    startTransition(async () => {
      const data = await fetchFullRankingAction(periodo, funcao);
      setRanking(data);
    });
  }, [searchParams]);

  useRealtimeTable("quiz_attempts", refresh, "status=eq.completed");

  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        Nenhum participante neste período ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <ul className="divide-y">
        {ranking.map((entry, i) => {
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
  );
}
