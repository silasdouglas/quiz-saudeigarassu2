import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import { QuestionFormDialog } from "@/components/admin/question-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteQuestion } from "@/app/(app)/admin/questions/actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DIFFICULTY_LABEL } from "@/lib/types";
import type { Category, Difficulty, Question, QuestionAnswer } from "@/lib/types";

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  facil: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  media: "bg-amber-500/10 text-amber-600 border-amber-200",
  dificil: "bg-red-500/10 text-red-600 border-red-200",
};

const PAGE_SIZE = 50;

function buildUrl(
  offset: number,
  filterCategory: string,
  filterDifficulty: string
): string {
  const p = new URLSearchParams();
  if (filterCategory) p.set("category_id", filterCategory);
  if (filterDifficulty) p.set("difficulty", filterDifficulty);
  p.set("offset", String(offset));
  return `/admin/questions?${p.toString()}`;
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    offset?: string;
    category_id?: string;
    difficulty?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const offset = Math.max(0, parseInt(params.offset ?? "0", 10));
  const filterCategory = params.category_id ?? "";
  const filterDifficulty = params.difficulty ?? "";

  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  let query = supabase
    .from("questions")
    .select("*, categories(name), question_answers(correct_option)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filterCategory) query = query.eq("category_id", filterCategory);
  if (filterDifficulty)
    query = query.eq("difficulty", filterDifficulty as Difficulty);

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
    return { question_id: q.id, correct_option: raw.correct_option as QuestionAnswer["correct_option"] };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Perguntas</h1>
        <QuestionFormDialog categories={(categories as Category[]) ?? []} />
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/questions" className="flex flex-wrap gap-2">
        <select
          name="category_id"
          defaultValue={filterCategory}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
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
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
        >
          <option value="">Todas as dificuldades</option>
          <option value="facil">Fácil</option>
          <option value="media">Média</option>
          <option value="dificil">Difícil</option>
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
        {(filterCategory || filterDifficulty) && (
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
          {(filterCategory || filterDifficulty) && " (filtradas)"}
        </p>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dificuldade</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-xs font-medium">
                    <span
                      className="line-clamp-2 block"
                      title={q.question_text}
                    >
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
                    <Badge
                      variant="outline"
                      className={DIFFICULTY_BADGE_CLASS[q.difficulty]}
                    >
                      {DIFFICULTY_LABEL[q.difficulty]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.time_limit_seconds}s
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        q.active
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    >
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
                        itemLabel={`a pergunta`}
                        action={deleteQuestion.bind(null, q.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma pergunta encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {(hasPrev || hasNext) && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de{" "}
              {total}
            </span>
            <div className="flex gap-2">
              {hasPrev && (
                <a
                  href={buildUrl(
                    Math.max(0, offset - PAGE_SIZE),
                    filterCategory,
                    filterDifficulty
                  )}
                  className="rounded-lg border px-3 py-1 hover:bg-muted"
                >
                  Anterior
                </a>
              )}
              {hasNext && (
                <a
                  href={buildUrl(
                    offset + PAGE_SIZE,
                    filterCategory,
                    filterDifficulty
                  )}
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
