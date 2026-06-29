import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import { QuestionFormDialog } from "@/components/admin/question-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { AddQuestionToScheduleDialog } from "@/components/admin/add-question-to-schedule-dialog";
import { ScheduleRowActions } from "@/components/admin/schedule-row-actions";
import { deleteQuestion } from "@/app/(app)/admin/questions/actions";
import {
  createSchedule,
  deleteSchedule,
  removeQuestion,
  syncAllToSchedule,
} from "@/app/(app)/admin/schedule/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DIFFICULTY_LABEL } from "@/lib/types";
import type {
  Category,
  Difficulty,
  Question,
  QuestionAnswer,
  WeeklySchedule,
} from "@/lib/types";
import { CalendarDays, Clock, LayoutGrid, Pill, RefreshCw, Search, ShieldCheck, Stethoscope, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  facil: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  media: "bg-amber-500/10 text-amber-600 border-amber-200",
  dificil: "bg-red-500/10 text-red-600 border-red-200",
};

const TARGET_ROLE_LABEL: Record<string, string> = {
  tecnico: "Técnico",
  enfermeira: "Enfermeira",
  ambos: "Ambos",
};

function formatWeekRange(weekStart: string): string {
  const [year, month, day] = weekStart.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 6);
  return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} — ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}

const PAGE_SIZE = 50;

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildUrl(
  offset: number,
  filterCategory: string,
  filterDifficulty: string,
  search: string
): string {
  const p = new URLSearchParams();
  if (search) p.set("q", search);
  if (filterCategory) p.set("category_id", filterCategory);
  if (filterDifficulty) p.set("difficulty", filterDifficulty);
  if (offset > 0) p.set("offset", String(offset));
  return `/admin/questions?${p.toString()}`;
}

const TABS = [
  { value: "perguntas", label: "Perguntas" },
  { value: "agendamento", label: "Agendamento" },
] as const;

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    offset?: string;
    category_id?: string;
    difficulty?: string;
    q?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tab = params.tab === "agendamento" ? "agendamento" : "perguntas";

  const supabase = await createClient();

  const [{ data: categories }, { data: catCounts }, { count: totalCount }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("questions").select("category_id, categories(name)").eq("active", true),
    supabase.from("questions").select("*", { count: "exact", head: true }),
  ]);

  const countsByCategory = (categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    count: (catCounts ?? []).filter((q) => q.category_id === cat.id).length,
  }));

  // ── TAB NAV ──────────────────────────────────────────────────────────────
  const TabNav = (
    <div className="flex gap-0.5 rounded-lg bg-muted p-0.5 w-fit">
      {TABS.map((t) => (
        <Link
          key={t.value}
          href={`/admin/questions${t.value === "agendamento" ? "?tab=agendamento" : ""}`}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            tab === t.value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );

  // ── AGENDAMENTO TAB ───────────────────────────────────────────────────────
  if (tab === "agendamento") {
    const weekStart = getWeekStart();

    const { data: schedules } = await supabase
      .from("weekly_schedules")
      .select("*")
      .order("week_start", { ascending: false });

    const currentSchedule = (schedules ?? []).find(
      (s) => s.week_start === weekStart
    ) as WeeklySchedule | undefined;

    type ScheduleQuestion = {
      question_id: string;
      questions: {
        id: string;
        question_text: string;
        difficulty: Difficulty;
        points: number;
        time_limit_seconds: number;
        target_role?: string | null;
        option_a: string;
        option_b: string;
        option_c: string;
        option_d: string;
        active: boolean;
        category_id: string | null;
        question_answers: Array<{ correct_option: string }> | null;
        categories: { name: string } | null;
      } | null;
    };

    let scheduleQuestions: ScheduleQuestion[] = [];
    let availableQuestions: Array<{
      id: string;
      question_text: string;
      difficulty: Difficulty;
      time_limit_seconds: number;
      categories: { name: string } | null;
    }> = [];
    let neverScheduledIds: string[] = [];

    if (currentSchedule) {
      const { data: sqData } = await supabase
        .from("schedule_questions")
        .select(
          "question_id, questions(id, question_text, difficulty, points, time_limit_seconds, target_role, option_a, option_b, option_c, option_d, active, category_id, question_answers(correct_option), categories(name))"
        )
        .eq("schedule_id", currentSchedule.id);

      scheduleQuestions = (sqData ?? []) as unknown as ScheduleQuestion[];

      const scheduledIds = new Set(scheduleQuestions.map((sq) => sq.question_id));
      const { data: allActive } = await supabase
        .from("questions")
        .select("id, question_text, difficulty, time_limit_seconds, target_role, categories(name)")
        .eq("active", true)
        .order("created_at", { ascending: false });

      availableQuestions = (
        (allActive ?? []) as unknown as typeof availableQuestions
      ).filter((q) => !scheduledIds.has(q.id));

      // Questions used in any previous schedule (not current)
      const { data: prevUsed } = await supabase
        .from("schedule_questions")
        .select("question_id")
        .neq("schedule_id", currentSchedule.id);
      const prevUsedIds = new Set((prevUsed ?? []).map((r) => r.question_id));
      neverScheduledIds = availableQuestions
        .filter((q) => !prevUsedIds.has(q.id))
        .map((q) => q.id);
    }

    const otherSchedules = (schedules ?? []).filter(
      (s) => s.week_start !== weekStart
    ) as WeeklySchedule[];

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Perguntas</h1>
          {TabNav}
        </div>

        {/* Current week */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h2 className="font-medium">
              Semana atual —{" "}
              <span className="text-muted-foreground">{formatWeekRange(weekStart)}</span>
            </h2>
          </div>

          {currentSchedule ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {scheduleQuestions.length}{" "}
                  {scheduleQuestions.length === 1 ? "pergunta" : "perguntas"} agendadas
                  {scheduleQuestions.length > 0 && (
                    <span className="ml-2 font-medium text-primary">
                      · {scheduleQuestions.reduce((sum, sq) => sum + (sq.questions?.points ?? 0), 0)} pts
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <AddQuestionToScheduleDialog
                    scheduleId={currentSchedule.id}
                    questions={availableQuestions}
                    neverScheduledIds={neverScheduledIds}
                  />
                  {availableQuestions.length > 0 && (
                    <form action={syncAllToSchedule.bind(null, currentSchedule.id)}>
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                        <RefreshCw className="size-3.5" />
                        Sincronizar todas ({availableQuestions.length})
                      </Button>
                    </form>
                  )}
                  <ConfirmDeleteButton
                    itemLabel="este agendamento"
                    action={deleteSchedule.bind(null, currentSchedule.id)}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pergunta</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Dificuldade</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead className="w-20 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleQuestions.map((sq) => {
                      const q = sq.questions;
                      if (!q) return null;
                      return (
                        <TableRow key={sq.question_id}>
                          <TableCell className="max-w-xs">
                            <span className="line-clamp-2 block text-sm">{q.question_text}</span>
                          </TableCell>
                          <TableCell>
                            {q.categories ? (
                              <Badge variant="outline">{q.categories.name}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={DIFFICULTY_BADGE_CLASS[q.difficulty]}>
                              {DIFFICULTY_LABEL[q.difficulty]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {q.target_role ? (
                              <Badge variant="outline" className="text-xs">
                                {TARGET_ROLE_LABEL[q.target_role] ?? q.target_role}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {q.time_limit_seconds}s
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <ScheduleRowActions
                                question={q as unknown as Question}
                                questionAnswer={
                                  Array.isArray(q.question_answers) && q.question_answers[0]
                                    ? { question_id: q.id, correct_option: q.question_answers[0].correct_option as QuestionAnswer["correct_option"] }
                                    : undefined
                                }
                                categories={(categories as Category[]) ?? []}
                                removeAction={removeQuestion.bind(null, currentSchedule.id, sq.question_id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {scheduleQuestions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhuma pergunta agendada. Adicione perguntas acima.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Nenhum agendamento para a semana atual.
              </p>
              <form action={createSchedule}>
                <input type="hidden" name="week_start" value={weekStart} />
                <Button type="submit" variant="outline">
                  Criar agendamento para esta semana
                </Button>
              </form>
            </div>
          )}
        </section>

        {/* Other schedules */}
        {otherSchedules.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Outros agendamentos
            </h2>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semana</TableHead>
                    <TableHead className="w-20 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherSchedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{formatDate(s.week_start)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <ConfirmDeleteButton
                            itemLabel={`o agendamento de ${formatDate(s.week_start)}`}
                            action={deleteSchedule.bind(null, s.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {/* Create schedule for custom date */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Criar agendamento para outra semana
          </h2>
          <form action={createSchedule} className="flex items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="week_start_custom" className="text-sm font-medium">
                Início da semana (segunda-feira)
              </label>
              <input
                id="week_start_custom"
                name="week_start"
                type="date"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
                required
              />
            </div>
            <Button type="submit" variant="outline">
              Criar agendamento
            </Button>
          </form>
        </section>
      </div>
    );
  }

  // ── PERGUNTAS TAB (default) ───────────────────────────────────────────────
  const offset = Math.max(0, parseInt(params.offset ?? "0", 10));
  const filterCategory = params.category_id ?? "";
  const filterDifficulty = params.difficulty ?? "";
  const search = (params.q ?? "").trim();
  const hasFilters = Boolean(filterCategory || filterDifficulty || search);

  let query = supabase
    .from("questions")
    .select("*, categories(name), question_answers(correct_option)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filterCategory) query = query.eq("category_id", filterCategory);
  if (filterDifficulty) query = query.eq("difficulty", filterDifficulty as Difficulty);
  if (search) query = query.ilike("question_text", `%${search}%`);

  const { data: rawQuestions, count } = await query;

  const total = count ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  type QuestionRow = Question & {
    categories: { name: string } | null;
    question_answers: Array<{ correct_option: string }> | { correct_option: string } | null;
  };

  const questions = (rawQuestions ?? []) as QuestionRow[];

  function getAnswer(q: QuestionRow): QuestionAnswer | undefined {
    if (!q.question_answers) return undefined;
    const raw = Array.isArray(q.question_answers)
      ? q.question_answers[0]
      : q.question_answers;
    if (!raw) return undefined;
    return {
      question_id: q.id,
      correct_option: raw.correct_option as QuestionAnswer["correct_option"],
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Perguntas</h1>
          {TabNav}
        </div>
        <QuestionFormDialog categories={(categories as Category[]) ?? []} />
      </div>

      {/* Stat cards */}
      {(() => {
        const CAT_STYLE: Record<string, { icon: React.ReactNode; bg: string; iconBg: string; iconColor: string }> = {
          "Vacinas e Imunização":       { icon: <Syringe className="size-5" />,     bg: "bg-blue-50 dark:bg-blue-950/40",    iconBg: "bg-blue-100 dark:bg-blue-900/60",   iconColor: "text-blue-600 dark:text-blue-400" },
          "Técnica de Administração":   { icon: <Stethoscope className="size-5" />, bg: "bg-amber-50 dark:bg-amber-950/40",  iconBg: "bg-amber-100 dark:bg-amber-900/60", iconColor: "text-amber-600 dark:text-amber-400" },
          "Farmacologia":               { icon: <Pill className="size-5" />,        bg: "bg-purple-50 dark:bg-purple-950/40",iconBg: "bg-purple-100 dark:bg-purple-900/60",iconColor: "text-purple-600 dark:text-purple-400" },
          "Biossegurança":              { icon: <ShieldCheck className="size-5" />, bg: "bg-rose-50 dark:bg-rose-950/40",    iconBg: "bg-rose-100 dark:bg-rose-900/60",   iconColor: "text-rose-600 dark:text-rose-400" },
        };
        const fallback = { icon: <LayoutGrid className="size-5" />, bg: "bg-muted/50", iconBg: "bg-muted", iconColor: "text-muted-foreground" };
        return (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-xl border bg-primary/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/70 mb-2">Total</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-primary">{totalCount ?? 0}</p>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <LayoutGrid className="size-4" />
                </div>
              </div>
              <p className="text-xs text-primary/60 mt-1">perguntas ativas</p>
            </div>
            {countsByCategory.map((cat) => {
              const s = CAT_STYLE[cat.name] ?? fallback;
              return (
                <div key={cat.id} className={`rounded-xl border p-4 ${s.bg}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 leading-tight">{cat.name}</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-3xl font-bold ${s.iconColor}`}>{cat.count}</p>
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${s.iconBg} ${s.iconColor}`}>
                      {s.icon}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">perguntas</p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Filters */}
      <form method="GET" action="/admin/questions" className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Pesquisar pergunta..."
            className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-2.5 text-sm outline-none focus:border-ring"
          />
        </div>
        <select
          name="category_id"
          defaultValue={filterCategory}
          className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
        >
          <option value="">Todas as categorias</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          name="difficulty"
          defaultValue={filterDifficulty}
          className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
        >
          <option value="">Todas as dificuldades</option>
          <option value="facil">Fácil</option>
          <option value="media">Média</option>
          <option value="dificil">Difícil</option>
        </select>
        <button
          type="submit"
          className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
        {hasFilters && (
          <a
            href="/admin/questions"
            className="flex h-8 items-center rounded-lg px-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpar
          </a>
        )}
      </form>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          {total} {total === 1 ? "pergunta" : "perguntas"}
          {hasFilters && " (filtradas)"}
        </p>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dificuldade</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-xs font-medium">
                    <span className="line-clamp-2 block" title={q.question_text}>
                      {q.question_text}
                    </span>
                  </TableCell>
                  <TableCell>
                    {q.categories ? (
                      <Badge variant="outline">{q.categories.name}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={DIFFICULTY_BADGE_CLASS[q.difficulty]}>
                      {DIFFICULTY_LABEL[q.difficulty]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {q.target_role ? (
                      <Badge variant="outline" className="text-xs">
                        {TARGET_ROLE_LABEL[q.target_role] ?? q.target_role}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.time_limit_seconds}s
                  </TableCell>
                  <TableCell>
                    <span className={q.active ? "text-emerald-600" : "text-muted-foreground"}>
                      {q.active ? "Sim" : "Não"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <QuestionFormDialog
                        question={q as Question}
                        questionAnswer={getAnswer(q)}
                        categories={(categories as Category[]) ?? []}
                      />
                      <ConfirmDeleteButton
                        itemLabel="a pergunta"
                        action={deleteQuestion.bind(null, q.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma pergunta encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {(hasPrev || hasNext) && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex gap-2">
              {hasPrev && (
                <a
                  href={buildUrl(Math.max(0, offset - PAGE_SIZE), filterCategory, filterDifficulty, search)}
                  className="rounded-lg border px-3 py-1 hover:bg-muted"
                >
                  Anterior
                </a>
              )}
              {hasNext && (
                <a
                  href={buildUrl(offset + PAGE_SIZE, filterCategory, filterDifficulty, search)}
                  className="rounded-lg border px-3 py-1 hover:bg-muted"
                >
                  Próxima
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
