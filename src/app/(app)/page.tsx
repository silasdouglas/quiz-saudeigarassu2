import Link from "next/link";
import { Clock3, PlayCircle } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { buildRanking, periodRange } from "@/lib/ranking";
import { RankingSection } from "@/components/ranking-section";

const PERIODS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
] as const;

type Period = "semanal" | "mensal" | "anual";

async function fetchRanking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  periodo: Period
) {
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

  const [ranking, weekStartResult] = await Promise.all([
    fetchRanking(supabase, periodo),
    supabase.rpc("current_week_start"),
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

      <RankingSection initialRanking={ranking} initialPeriodo={periodo} />

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
