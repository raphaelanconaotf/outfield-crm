import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function count(table: string) {
  const supabase = await createClient();
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function HomePage() {
  const profile = await requireProfile();
  const [empresas, contatos, negociacoes, projetos, tarefas] = await Promise.all([
    count("companies"),
    count("contacts"),
    count("deals"),
    count("projects"),
    count("tasks"),
  ]);

  const cards = [
    { label: "Empresas", value: empresas, href: "/empresas" },
    { label: "Contatos", value: contatos, href: "/contatos" },
    { label: "Negociações", value: negociacoes, href: "/pipeline" },
    { label: "Projetos", value: projetos, href: "/projetos" },
    { label: "Tarefas", value: tarefas, href: "/tarefas" },
  ];

  return (
    <>
      <PageHeader
        title={`Olá, ${profile.nome.split(" ")[0]}`}
        description="Resumo do que você tem acesso no CRM."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-line bg-surface p-4 transition hover:border-brand"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        Dashboard completo (pipeline por etapa e casa, valor ponderado, tarefas vencidas) chega na entrega 4.
      </p>
    </>
  );
}
