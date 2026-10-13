import { ComingSoon, PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Tarefas" description="Kanban de tarefas por projeto." />
      <ComingSoon entrega={4} items={["Kanban por projeto", "Minhas tarefas: vencidas e da semana", "Tarefas internas fora de projetos"]} />
    </>
  );
}
