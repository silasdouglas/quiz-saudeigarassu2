import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttemptAnswersDialog } from "@/components/admin/attempt-answers-dialog";
import { ResetAttemptButton } from "@/components/admin/reset-attempt-button";
import { ClipboardList } from "lucide-react";

interface AdminAttemptRow {
  attempt_id: string;
  user_id: string;
  full_name: string;
  email: string;
  funcao: "tecnico_enfermagem" | "enfermeira" | null;
  role: "admin" | "user";
  week_start: string;
  status: "in_progress" | "completed";
  total_score: number;
  total_time_seconds: number;
  tab_switch_count: number;
  started_at: string;
  finished_at: string | null;
  answered_count: number;
  correct_count: number;
}

const FUNCAO_LABEL: Record<string, string> = {
  tecnico_enfermagem: "Técnico",
  enfermeira: "Enfermeira(o)",
};

function formatWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function AdminAttemptsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_attempts");
  const rows = (data ?? []) as AdminAttemptRow[];

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <ClipboardList className="size-5 text-primary" />
        <h1 className="text-xl font-semibold">Tentativas por usuário</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Cada quiz respondido por cada usuário. Use{" "}
        <span className="font-medium text-foreground">Ver respostas</span> para
        auditar as alternativas e{" "}
        <span className="font-medium text-foreground">Liberar</span> para
        permitir que o usuário refaça o quiz.
      </p>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </p>
      )}

      {rows.length === 0 && !error ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma tentativa registrada ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Semana</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="text-right">Acertos</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.attempt_id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {r.full_name || r.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {r.email}
                        {r.role === "admin" && (
                          <Badge variant="secondary" className="text-[10px]">
                            admin
                          </Badge>
                        )}
                        {r.funcao && (
                          <Badge variant="outline" className="text-[10px]">
                            {FUNCAO_LABEL[r.funcao]}
                          </Badge>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatWeek(r.week_start)}
                  </TableCell>
                  <TableCell>
                    {r.status === "completed" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                        Concluído
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Em andamento
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {r.total_score}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.correct_count}/{r.answered_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                    {Math.round(r.total_time_seconds)}s
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <AttemptAnswersDialog
                        attemptId={r.attempt_id}
                        userName={r.full_name || r.email}
                      />
                      <ResetAttemptButton
                        attemptId={r.attempt_id}
                        userName={r.full_name || r.email}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
