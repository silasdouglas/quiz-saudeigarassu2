"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const VALID_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const VALID_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function updateAvatar(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Selecione uma imagem." };
  if (file.size > 5 * 1024 * 1024) return { error: "Imagem muito grande. Escolha um arquivo com até 5 MB." };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mime = file.type.toLowerCase();

  if (!VALID_EXTS.includes(ext) && !VALID_MIME.includes(mime)) {
    return { error: "Formato inválido. Use JPG, PNG, WebP ou HEIC." };
  }

  const finalExt = VALID_EXTS.includes(ext) ? ext : "jpg";
  const supabase = await createClient();
  const path = `${user.id}.${finalExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
  const urlWithBust = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: urlWithBust })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updatePassword(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const currentPassword = String(formData.get("current_password") ?? "").trim();
  const newPassword = String(formData.get("new_password") ?? "").trim();
  const confirmPassword = String(formData.get("confirm_password") ?? "").trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Preencha todos os campos." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Nova senha e confirmação não conferem." };
  }
  if (newPassword.length < 6) {
    return { error: "Nova senha deve ter ao menos 6 caracteres." };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Senha atual incorreta." };

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: updateError.message };

  return {};
}

export async function updateProfile(formData: FormData): Promise<{ error?: string; emailPending?: boolean }> {
  const user = await requireUser();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName) return { error: "Nome não pode ser vazio." };
  if (!email || !email.includes("@")) return { error: "E-mail inválido." };

  const supabase = await createClient();

  const { error: nameErr } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);
  if (nameErr) return { error: nameErr.message };

  if (email !== user.email.toLowerCase()) {
    const { error: emailErr } = await supabase.auth.updateUser({ email });
    if (emailErr) return { error: emailErr.message };
    revalidatePath("/", "layout");
    return { emailPending: true };
  }

  revalidatePath("/", "layout");
  return {};
}
