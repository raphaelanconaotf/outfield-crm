import { Sidebar } from "@/components/sidebar";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen md:flex">
      <Sidebar profile={profile} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
