import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // email is not selectable from profiles by authenticated users (PII hardening,
  // migration 0026); the user's own email comes from the auth session instead.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, funcao, created_at, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Auth user exists but profile is missing — sign out to break redirect loop
    await supabase.auth.signOut();
    return null;
  }

  return { ...profile, email: user.email ?? "" } as Profile;
});

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin") redirect("/quiz");
  return profile;
}
