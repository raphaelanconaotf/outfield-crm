import { ComingSoon, PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Empresas" description="Clubes, SAFs, investidores, patrocinadores e demais organizações." />
      <ComingSoon entrega={2} items={["Lista com filtros por tipo, país e responsável", "Ficha da empresa com contatos, negociações e projetos", "Importação da base atual (CSV)"]} />
    </>
  );
}
