import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { LoginButton } from "./login-button";

const ERRORS: Record<string, string> = {
  nao_autorizado: "Seu e-mail ainda não está autorizado. Peça a um Admin para cadastrá-lo.",
  dominio: "Use sua conta Google @outfieldinc.com.",
  inativo: "Seu acesso está desativado. Fale com um Admin.",
  sem_codigo: "O login não foi concluído. Tente novamente.",
  falha_login: "Não foi possível concluir o login. Tente novamente em uma aba anônima.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detalhe?: string }>;
}) {
  const { error, detalhe } = await searchParams;
  const profile = await getProfile();
  if (profile?.ativo && !error) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-subtle px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            OTF
          </div>
          <h1 className="text-xl font-semibold text-ink">CRM Outfield</h1>
          <p className="mt-1 text-sm text-muted">Contatos, negociações e projetos da Outfield Strategies.</p>
        </div>

        {error && ERRORS[error] && (
          <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {ERRORS[error]}
            {detalhe && <span className="mt-1 block text-xs opacity-80">Detalhe técnico: {detalhe}</span>}
          </p>
        )}

        <LoginButton />
        <p className="mt-4 text-center text-xs text-muted">Acesso restrito a contas @outfieldinc.com</p>
      </div>
    </main>
  );
}
