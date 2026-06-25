import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { AddQuestionToScheduleDialog } from "@/components/admin/add-question-to-schedule-dialog";
import {
  createSchedule,
  deleteSchedule,
  removeQuestion,
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
import type { Difficulty, WeeklySchedule } from "@/lib/types";
import { CalendarDays, Clock } from "lucide-react";

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  facil: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  media: "bg-amber-500/10 text-amber-600 border-amber-200",
  dificil: "bg-red-500/10 text-red-600 border-red-200",
};

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

export default async function AdminSchedulePage() {
  await requireAdmin();
  const supabase = await createClient();
  const weekStart = getWeekStart();

  // Fetch all schedules ordered by week_start desc
  const { data: schedules } = await supabase
    .from("weekly_schedules")
    .select("*")
    .order("week_start", { ascending: false });

  // Find the current week's schedule
  const currentSchedule = (schedules ?? []).find(
    (s) => s.week_start === weekStart
  ) as WeeklySchedule | undefined;

  // Fetch questions in current schedule
  type ScheduleQuestion = {
    question_id: string;
    questions: {
      id: string;
      question_text: string;
      difficulty: Difficulty;
      time_limit_seconds: number;
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

  if (currentSchedule) {
    const { data: sqData } = await supabase
      .from("schedule_questions")
      .select(
        "question_id, questions(id, question_text, difficulty, time_limit_seconds, categories(name))"
      )
      .eq("schedule_id", currentSchedule.id);

    scheduleQuestions = (sqData ?? []) as unknown as ScheduleQuestion[];

    // Fetch all active questions not yet in schedule
    const scheduledIds = new Set(scheduleQuestions.map((sq) => sq.question_id));
    const { data: allActive } = await supabase
      .from("questions")
      .select("id, question_text, difficulty, time_limit_seconds, categories(name)")
      .eq("active", true)
      .order("created_at", { ascending: false });

    availableQuestions = ((allActive ?? []) as unknown as typeof availableQuestions).filter(
      (q) => !scheduledIds.has(q.id)
    );
  }

  const otherSchedules = (schedules ?? []).filter(
    (s) => s.week_start !== weekStart
  ) as WeeklySchedule[];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Agendamento</h1>

      {/* Current week section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h2 className="font-medium">
            Semana atual —{" "}
            <span className="text-muted-foreground">{formatDate(weekStart)}</span>
          </h2>
        </div>

        {currentSchedule ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {scheduleQuestions.length}{" "}
                {scheduleQuestions.length === 1 ? "pergunta" : "perguntas"} no
                agendamento
              </p>
              <div className="flex gap-2">
                <AddQuestionToScheduleDialog
                  scheduleId={currentSchedule.id}
                  questions={availableQuestions}
                />
                <ConfirmDeleteButton
                  itemLabel="este agendamento"
                  action={deleteSchedule.bind(null, currentSchedule.id)}
                />
              </div>
            </div>

            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pergunta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead className="w-16 text-right">Remover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleQuestions.map((sq) => {
                    const q = sq.questions;
                    if (!q) return null;
                    return (
                      <TableRow key={sq.question_id}>
                        <TableCell className="max-w-xs">
                          <span className="line-clamp-2 block text-sm">
                            {q.question_text}
                          </span>
                        </TableCell>
                        <TableCell>
                          {q.categories ? (
                            <Badge variant="outline">
                              {q.categories.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={DIFFICULTY_BADGE_CLASS[q.difficulty]}
                          >
                            {DIFFICULTY_LABEL[q.difficulty]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {q.time_limit_seconds}s
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <ConfirmDeleteButton
                              itemLabel="a pergunta do agendamento"
                              action={removeQuestion.bind(
                                null,
                                currentSchedule.id,
                                sq.question_id
                              )}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {scheduleQuestions.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
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
          <div className="rounded-xl border">
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
                    <TableCell className="font-medium">
                      {formatDate(s.week_start)}
                    </TableCell>
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
