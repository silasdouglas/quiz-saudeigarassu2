"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type CategoryFormState = { error?: string } | undefined;

export async function createCategory(
  _state: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name, description });
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
}

export async function updateCategory(
  id: string,
  _state: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, description })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
}
