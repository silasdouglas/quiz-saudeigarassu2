export interface RankingEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  time_seconds: number;
}

type RawAttempt = {
  user_id: string;
  total_score: number;
  started_at: string | null;
  finished_at: string | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

export function buildRanking(attempts: RawAttempt[]): RankingEntry[] {
  const map = new Map<string, RankingEntry>();

  for (const a of attempts) {
    const profile = a.profiles;
    const timeSec =
      a.started_at && a.finished_at
        ? Math.max(
            0,
            Math.round(
              (new Date(a.finished_at).getTime() -
                new Date(a.started_at).getTime()) /
                1000
            )
          )
        : 0;

    const existing = map.get(a.user_id);
    if (existing) {
      existing.score += a.total_score;
      existing.time_seconds += timeSec;
    } else {
      map.set(a.user_id, {
        user_id: a.user_id,
        name: profile?.full_name ?? "Usuário",
        avatar_url: profile?.avatar_url ?? null,
        score: a.total_score,
        time_seconds: timeSec,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => b.score - a.score || a.time_seconds - b.time_seconds
  );
}

export function periodRange(periodo: string): {
  start: string;
  end: string;
} {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-based

  if (periodo === "mensal") {
    const start = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(year, month + 1, 0))
      .toISOString()
      .slice(0, 10);
    return { start, end };
  }

  if (periodo === "anual") {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
    };
  }

  // semanal: compute current week_start (Monday)
  const day = now.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + offset);
  const weekStart = monday.toISOString().slice(0, 10);
  return { start: weekStart, end: weekStart };
}
