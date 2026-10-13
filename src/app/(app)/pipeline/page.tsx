import { ComingSoon, PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Pipeline de vendas" description="Negociações por etapa." />
      <ComingSoon entrega={3} items={["Kanban arrastável por etapa", "Valor e probabilidade visíveis só para Admin e Sócio", "Ganha vira projeto com um clique"]} />
    </>
  );
}
