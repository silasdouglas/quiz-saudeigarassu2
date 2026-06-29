import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buildRanking, periodRange } from "@/lib/ranking";
import { RankingListLive } from "@/components/ranking/ranking-list-live";

const PERIODS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
] as const;

type Period = "semanal" | "mensal" | "anual";

type Funcao = "all" | "tecnico_enfermagem" | "enfermeira";
const FUNCOES = [
  { value: "all" as Funcao, label: "Todos" },
  { value: "tecnico_enfermagem" as Funcao, label: "Técnicos" },
  { value: "enfermeira" as Funcao, label: "Enfermeiras" },
];


export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; funcao?: string }>;
}) {
  await requireUser();
  const supabase = await createClient();
  const params = await searchParams;

  const periodo = (
    PERIODS.map((p) => p.value).includes(params.periodo as Period)
      ? params.periodo
      : "semanal"
  ) as Period;

  const funcao = (
    ["all", "tecnico_enfermagem", "enfermeira"].includes(params.funcao as string)
      ? params.funcao
      : "all"
  ) as Funcao;

  const { start, end } = periodRange(periodo);

  const query = supabase
    .from("quiz_attempts")
    .select("user_id, total_score, started_at, finished_at, profiles(full_name, avatar_url, role, funcao)")
    .eq("status", "completed");

  const { data } =
    periodo === "semanal"
      ? await query.eq("week_start", start)
      : await query.gte("week_start", start).lte("week_start", end);

  const ranking = buildRanking((data ?? []) as unknown as Parameters<typeof buildRanking>[0], funcao);

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
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        </div>
      </div>

      {/* Period filter */}
      <div className="mb-5 flex gap-1.5">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/ranking?periodo=${p.value}&funcao=${funcao}`}
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

      {/* Funcao filter */}
      <div className="mb-5 flex gap-1.5">
        {FUNCOES.map((f) => (
          <Link
            key={f.value}
            href={`/ranking?periodo=${periodo}&funcao=${f.value}`}
            className={cn(
              "rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
              funcao === f.value
                ? "bg-secondary text-secondary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Suspense>
        <RankingListLive initialRanking={ranking} />
      </Suspense>
    </div>
  );
}
