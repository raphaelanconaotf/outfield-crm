import { PageHeader } from "@/components/page-header";
import { ROLE_LABEL, ROLES, requireAdmin, type Profile, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addAllowedEmail, removeAllowedEmail, updateUser } from "./actions";

type Invite = { email: string; nome: string; role: Role; created_at: string };

const input =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft";
const button =
  "rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition hover:opacity-90";
const ghost = "rounded-md border border-line px-3 py-1.5 text-sm transition hover:bg-subtle";

function RoleSelect({ name, value }: { name: string; value?: Role }) {
  return (
    <select name={name} defaultValue={value ?? "equipe"} className={input} aria-label="Perfil">
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const me = await requireAdmin();
  const { ok, erro } = await searchParams;
  const supabase = await createClient();

  const [{ data: profiles }, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("id, email, nome, cargo, role, ativo").order("nome"),
    supabase.from("allowed_emails").select("email, nome, role, created_at").order("nome"),
  ]);

  const users = (profiles ?? []) as Profile[];
  const registered = new Set(users.map((u) => u.email));
  const pending = ((invites ?? []) as Invite[]).filter((i) => !registered.has(i.email));

  return (
    <>
      <PageHeader title="Admin" description="Quem acessa o CRM e com qual perfil." />

      {ok && <p className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{ok}</p>}
      {erro && <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{erro}</p>}

      <section className="mb-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-medium">Autorizar novo usuário</h2>
        <p className="mt-1 text-sm text-muted">
          A pessoa entra com a conta Google @outfieldinc.com; o perfil escolhido aqui vale a partir do primeiro login.
        </p>
        <form action={addAllowedEmail} className="mt-4 flex flex-wrap gap-2">
          <input name="nome" placeholder="Nome" required className={`${input} min-w-40 flex-1`} />
          <input name="email" type="email" placeholder="nome@outfieldinc.com" required className={`${input} min-w-56 flex-1`} />
          <RoleSelect name="role" />
          <button className={button}>Autorizar</button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Usuários ({users.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Perfil e acesso</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {u.nome}
                    {u.id === me.id && <span className="ml-2 text-xs text-muted">(você)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <form action={updateUser} className="flex items-center gap-3">
                      <input type="hidden" name="id" value={u.id} />
                      <RoleSelect name="role" value={u.role} />
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" name="ativo" defaultChecked={u.ativo} className="accent-[var(--brand)]" />
                        Ativo
                      </label>
                      <button className={ghost}>Salvar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Aguardando primeiro login ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted">Ninguém pendente.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {pending.map((i) => (
              <li key={i.email} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {i.nome} <span className="text-muted">· {i.email} · {ROLE_LABEL[i.role]}</span>
                </span>
                <form action={removeAllowedEmail}>
                  <input type="hidden" name="email" value={i.email} />
                  <button className={ghost}>Remover</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
