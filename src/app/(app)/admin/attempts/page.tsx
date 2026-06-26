import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import {
  AttemptsList,
  type AdminAttemptRow,
} from "@/components/admin/attempts-list";
import { ClipboardList } from "lucide-react";

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
        Cada quiz respondido por cada usuário. Clique no nome para ver o perfil
        completo, ou use{" "}
        <span className="font-medium text-foreground">Ver respostas</span> e{" "}
        <span className="font-medium text-foreground">Liberar</span> nova
        tentativa.
      </p>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <AttemptsList rows={rows} />
    </div>
  );
}
