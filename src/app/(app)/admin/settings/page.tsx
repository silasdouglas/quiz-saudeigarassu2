import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/dal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/app/(app)/admin/settings/actions";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("quiz_settings")
    .select("*")
    .eq("id", true)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Configurações Gerais</h1>

      <div className="max-w-md rounded-xl border p-6">
        <form action={updateSettings} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="default_time_limit_seconds">
              Tempo limite padrão (segundos)
            </Label>
            <Input
              id="default_time_limit_seconds"
              name="default_time_limit_seconds"
              type="number"
              min="1"
              defaultValue={settings?.default_time_limit_seconds ?? 60}
              required
            />
            <p className="text-xs text-muted-foreground">
              Usado quando a pergunta não define um tempo específico.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tab_switch_penalty_points">
              Penalidade por troca de aba (pontos)
            </Label>
            <Input
              id="tab_switch_penalty_points"
              name="tab_switch_penalty_points"
              type="number"
              min="0"
              defaultValue={settings?.tab_switch_penalty_points ?? 5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Pontos descontados a cada vez que o usuário sai da aba.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_tab_switches">Máximo de trocas de aba</Label>
            <Input
              id="max_tab_switches"
              name="max_tab_switches"
              type="number"
              min="0"
              defaultValue={settings?.max_tab_switches ?? 3}
              required
            />
            <p className="text-xs text-muted-foreground">
              O quiz é encerrado automaticamente ao atingir esse limite.
            </p>
          </div>

          <Button type="submit" className="w-full">
            Salvar configurações
          </Button>
        </form>
      </div>
    </div>
  );
}
