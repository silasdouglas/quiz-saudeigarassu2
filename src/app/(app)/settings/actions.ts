"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function updateAvatar(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Selecione uma imagem." };
  if (file.size > 2 * 1024 * 1024) return { error: "Imagem deve ter no máximo 2 MB." };
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png", "webp"].includes(ext ?? "")) return { error: "Formato inválido. Use JPG, PNG ou WebP." };

  const supabase = await createClient();
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

  // Add cache-busting query so Next.js Image revalidates
  const urlWithBust = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: urlWithBust })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}
