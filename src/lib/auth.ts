import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

import type { Profile } from "@/lib/auth-labels";

export type { Profile, Role } from "@/lib/auth-labels";
export { ROLE_LABEL, ROLES } from "@/lib/auth-labels";

export const ALLOWED_DOMAIN = "outfieldinc.com";

/** Perfil do usuário logado (ou null). Cacheado por requisição. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, nome, cargo, role, ativo")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || !profile.ativo) redirect("/auth/signout?error=inativo");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}
