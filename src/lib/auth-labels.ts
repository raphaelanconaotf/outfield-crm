// Tipos e rótulos que podem ser usados também em componentes de cliente.
export type Role = "admin" | "socio" | "equipe";

export type Profile = {
  id: string;
  email: string;
  nome: string;
  cargo: string | null;
  role: Role;
  ativo: boolean;
};

export const ROLES: Role[] = ["admin", "socio", "equipe"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  socio: "Sócio",
  equipe: "Equipe",
};
