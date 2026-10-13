"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROLE_LABEL, type Profile } from "@/lib/auth-labels";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/empresas", label: "Empresas" },
  { href: "/contatos", label: "Contatos" },
  { href: "/pipeline", label: "Pipeline de vendas" },
  { href: "/projetos", label: "Projetos" },
  { href: "/tarefas", label: "Tarefas" },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = profile.role === "admin" ? [...NAV, { href: "/admin", label: "Admin" }] : NAV;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Barra superior no celular */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <span className="font-semibold">CRM Outfield</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-line px-3 py-1 text-sm"
          aria-expanded={open}
          aria-controls="sidebar"
        >
          Menu
        </button>
      </div>

      <aside
        id="sidebar"
        className={`${open ? "block" : "hidden"} border-r border-line bg-surface md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col`}
      >
        <div className="hidden items-center gap-2 px-5 py-5 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">
            OTF
          </div>
          <span className="font-semibold">CRM Outfield</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                isActive(item.href)
                  ? "bg-brand-soft font-medium text-brand"
                  : "text-muted hover:bg-subtle hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-sm font-medium">{profile.nome}</p>
          <p className="truncate text-xs text-muted">
            {ROLE_LABEL[profile.role]} · {profile.email}
          </p>
          <form action="/auth/signout" method="post" className="mt-3">
            <button className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Sair</button>
          </form>
        </div>
      </aside>
    </>
  );
}
