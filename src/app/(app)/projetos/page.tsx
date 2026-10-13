import { ComingSoon, PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Projetos" description="Projetos ativos da Outfield Strategies." />
      <ComingSoon entrega={4} items={["Lista por status, líder e casa OTF", "Equipe, fase, datas, receita e impostos", "Marcos e documentos"]} />
    </>
  );
}
