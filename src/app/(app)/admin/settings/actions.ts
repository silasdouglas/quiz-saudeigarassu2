"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData): Promise<void> {
  await requireAdmin();

  const defaultTimeLimitSeconds = Number(
    formData.get("default_time_limit_seconds") ?? 60
  );
  const tabSwitchPenaltyPoints = Number(
    formData.get("tab_switch_penalty_points") ?? 5
  );
  const maxTabSwitches = Number(formData.get("max_tab_switches") ?? 3);

  if (
    !Number.isFinite(defaultTimeLimitSeconds) ||
    defaultTimeLimitSeconds <= 0 ||
    !Number.isFinite(tabSwitchPenaltyPoints) ||
    tabSwitchPenaltyPoints < 0 ||
    !Number.isFinite(maxTabSwitches) ||
    maxTabSwitches < 0
  )
    return;

  const supabase = await createClient();
  await supabase
    .from("quiz_settings")
    .update({
      default_time_limit_seconds: defaultTimeLimitSeconds,
      tab_switch_penalty_points: tabSwitchPenaltyPoints,
      max_tab_switches: maxTabSwitches,
    })
    .eq("id", true);

  revalidatePath("/admin/settings");
}
