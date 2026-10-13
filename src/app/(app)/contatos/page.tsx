import { ComingSoon, PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Contatos" description="Pessoas com quem a Outfield se relaciona." />
      <ComingSoon entrega={2} items={["Busca global por nome, empresa e e-mail", "Ficha com histórico de interações", "Dono da relação e tags"]} />
    </>
  );
}
