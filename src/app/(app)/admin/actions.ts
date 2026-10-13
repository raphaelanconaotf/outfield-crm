"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ALLOWED_DOMAIN, ROLES, requireAdmin, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function done(params: Record<string, string>): never {
  revalidatePath("/admin");
  redirect(`/admin?${new URLSearchParams(params)}`);
}

function parseRole(value: FormDataEntryValue | null): Role {
  const role = String(value ?? "");
  if (!ROLES.includes(role as Role)) done({ erro: "Perfil inválido." });
  return role as Role;
}

export async function addAllowedEmail(formData: FormData) {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nome = String(formData.get("nome") ?? "").trim();
  const role = parseRole(formData.get("role"));

  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) done({ erro: `Use um e-mail @${ALLOWED_DOMAIN}.` });
  if (!nome) done({ erro: "Informe o nome." });

  const supabase = await createClient();
  const { error } = await supabase
    .from("allowed_emails")
    .insert({ email, nome, role, created_by: admin.id });

  if (error) done({ erro: error.code === "23505" ? "Esse e-mail já está cadastrado." : error.message });
  done({ ok: `${nome} cadastrado. O acesso libera no primeiro login com Google.` });
}

export async function removeAllowedEmail(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
  if (error) done({ erro: error.message });
  done({ ok: "Convite removido." });
}

export async function updateUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const role = parseRole(formData.get("role"));
  const ativo = formData.get("ativo") === "on";

  if (id === admin.id && (!ativo || role !== "admin")) {
    done({ erro: "Você não pode remover o seu próprio acesso de Admin." });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role, ativo })
    .eq("id", id)
    .select("email")
    .single();

  if (error) done({ erro: error.message });
  // Mantém o convite em linha com o perfil atual.
  await supabase.from("allowed_emails").update({ role }).eq("email", data.email);
  done({ ok: "Usuário atualizado." });
}
