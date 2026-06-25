"use server";

import { createClient } from "@/lib/supabase/server";
import { buildRanking, periodRange, type RankingEntry } from "@/lib/ranking";

export async function fetchRankingAction(periodo: string): Promise<RankingEntry[]> {
  const supabase = await createClient();
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
