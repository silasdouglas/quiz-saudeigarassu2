"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAdminAttemptsAction,
  type AdminAttemptRow,
} from "@/app/(app)/admin/attempts/actions";
import { useRealtimeTable } from "@/lib/hooks/use-realtime";

export type { AdminAttemptRow };

const FUNCAO_LABEL: Record<string, string> = {
  tecnico: "Técnico",
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

export function AttemptsList({ rows: initialRows }: { rows: AdminAttemptRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [week, setWeek] = useState("all");
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const data = await fetchAdminAttemptsAction();
      setRows(data);
    });
  }, []);

  useRealtimeTable("quiz_attempts", refresh);

  const weeks = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.week_start))).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (week !== "all" && r.week_start !== week) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    });
  }, [rows, query, week]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por nome ou e-mail…"
            className="pl-9"
          />
        </div>
        <Select value={week} onValueChange={setWeek}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Semana" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as semanas</SelectItem>
            {weeks.map((w) => (
              <SelectItem key={w} value={w}>
                {formatWeek(w)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-2 text-xs text-muted-foreground">
        {filtered.length} tentativa(s)
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma tentativa encontrada.
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
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.attempt_id}
                  onPointerEnter={() => router.prefetch(`/admin/attempts/${r.user_id}`)}
                  onClick={() => router.push(`/admin/attempts/${r.user_id}`)}
                  className="cursor-pointer"
                >
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
                    ) : r.status === "reset" ? (
                      <Badge variant="outline" className="text-sky-600 border-sky-300">
                        Pendente
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
                  <TableCell className="text-right">
                    <ChevronRight className="size-4 text-muted-foreground" />
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
