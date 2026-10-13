-- =============================================================
-- CRM Outfield — schema inicial (v1)
-- Perfis: admin / socio / equipe. Regras de acesso via RLS.
-- =============================================================

-- ---------- Tipos ----------
create type public.user_role as enum ('admin', 'socio', 'equipe');
create type public.interaction_type as enum ('reuniao', 'ligacao', 'email', 'nota');
create type public.stage_kind as enum ('aberta', 'ganha', 'perdida');
create type public.project_status as enum ('planejado', 'ativo', 'pausado', 'concluido');
create type public.project_role as enum ('lider', 'membro');
create type public.task_status as enum ('a_fazer', 'fazendo', 'revisao', 'feito');
create type public.task_priority as enum ('baixa', 'media', 'alta', 'urgente');

-- ---------- Usuários ----------
-- Lista de e-mails autorizados (o Admin cadastra antes do primeiro login).
create table public.allowed_emails (
  email       text primary key check (email = lower(email) and email like '%@outfieldinc.com'),
  nome        text not null,
  role        public.user_role not null default 'equipe',
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  nome        text not null,
  cargo       text,
  role        public.user_role not null default 'equipe',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Listas configuráveis ----------
create table public.casas_otf (
  codigo  text primary key check (codigo ~ '^0[1-9]$'),
  nome    text not null,
  ativo   boolean not null default true
);

create table public.deal_stages (
  id     smallint generated always as identity primary key,
  nome   text not null unique,
  ordem  smallint not null,
  tipo   public.stage_kind not null default 'aberta',
  ativo  boolean not null default true
);

create table public.company_types (
  id     smallint generated always as identity primary key,
  nome   text not null unique,
  ativo  boolean not null default true
);

-- ---------- CRM ----------
create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  company_type_id  smallint references public.company_types (id),
  pais             text default 'Brasil',
  cidade           text,
  site             text,
  owner_id         uuid references public.profiles (id) on delete set null,
  tags             text[] not null default '{}',
  notas            text,
  arquivado_em     timestamptz,
  created_by       uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index companies_nome_idx on public.companies (lower(nome));

create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  cargo         text,
  email         text,
  telefone      text,
  linkedin      text,
  company_id    uuid references public.companies (id) on delete set null,
  owner_id      uuid references public.profiles (id) on delete set null,
  tags          text[] not null default '{}',
  notas         text,
  arquivado_em  timestamptz,
  created_by    uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index contacts_company_idx on public.contacts (company_id);
create index contacts_nome_idx on public.contacts (lower(nome));

create table public.deals (
  id                        uuid primary key default gen_random_uuid(),
  titulo                    text not null,
  company_id                uuid references public.companies (id) on delete set null,
  stage_id                  smallint not null references public.deal_stages (id),
  casa_otf                  text references public.casas_otf (codigo),
  data_prevista_fechamento  date,
  socio_id                  uuid references public.profiles (id) on delete set null,
  motivo_perda              text,
  ordem                     double precision not null default 0,
  arquivado_em              timestamptz,
  created_by                uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index deals_stage_idx on public.deals (stage_id, ordem);

-- Valores ficam à parte: a RLS filtra linhas, então separar a tabela esconde valores do perfil Equipe.
create table public.deal_financials (
  deal_id         uuid primary key references public.deals (id) on delete cascade,
  valor_estimado  numeric(14, 2),
  probabilidade   smallint check (probabilidade between 0 and 100),
  link_proposta   text,
  updated_at      timestamptz not null default now()
);

create table public.deal_members (
  deal_id     uuid references public.deals (id) on delete cascade,
  profile_id  uuid references public.profiles (id) on delete cascade,
  primary key (deal_id, profile_id)
);

create table public.deal_contacts (
  deal_id     uuid references public.deals (id) on delete cascade,
  contact_id  uuid references public.contacts (id) on delete cascade,
  primary key (deal_id, contact_id)
);

create table public.interactions (
  id          uuid primary key default gen_random_uuid(),
  tipo        public.interaction_type not null default 'nota',
  data        timestamptz not null default now(),
  resumo      text not null,
  autor_id    uuid not null references public.profiles (id) default auth.uid(),
  contact_id  uuid references public.contacts (id) on delete cascade,
  company_id  uuid references public.companies (id) on delete cascade,
  deal_id     uuid references public.deals (id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (contact_id is not null or company_id is not null or deal_id is not null)
);
create index interactions_contact_idx on public.interactions (contact_id, data desc);
create index interactions_company_idx on public.interactions (company_id, data desc);
create index interactions_deal_idx on public.interactions (deal_id, data desc);

-- ---------- Projetos e tarefas ----------
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  company_id      uuid references public.companies (id) on delete set null,
  deal_id         uuid references public.deals (id) on delete set null,
  casa_otf        text references public.casas_otf (codigo),
  lider_id        uuid references public.profiles (id) on delete set null,
  socio_id        uuid references public.profiles (id) on delete set null,
  status          public.project_status not null default 'planejado',
  fase            text,
  inicio          date,
  fim_previsto    date,
  valor_contrato  numeric(14, 2),
  impostos        numeric(14, 2),
  arquivado_em    timestamptz,
  created_by      uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.project_members (
  project_id  uuid references public.projects (id) on delete cascade,
  profile_id  uuid references public.profiles (id) on delete cascade,
  papel       public.project_role not null default 'membro',
  primary key (project_id, profile_id)
);

create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  descricao       text,
  project_id      uuid references public.projects (id) on delete cascade,
  responsavel_id  uuid references public.profiles (id) on delete set null,
  status          public.task_status not null default 'a_fazer',
  prioridade      public.task_priority not null default 'media',
  prazo           date,
  ordem           double precision not null default 0,
  created_by      uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index tasks_project_idx on public.tasks (project_id, status, ordem);
create index tasks_responsavel_idx on public.tasks (responsavel_id, prazo);

-- ---------- Auditoria ----------
create table public.audit_log (
  id           bigint generated always as identity primary key,
  tabela       text not null,
  registro_id  text,
  acao         text not null,
  autor_id     uuid,
  antes        jsonb,
  depois       jsonb,
  created_at   timestamptz not null default now()
);

-- =============================================================
-- Funções auxiliares de permissão (security definer evita recursão de RLS)
-- =============================================================
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and ativo
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and ativo) $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.my_role() = 'admin', false) $$;

create or replace function public.is_socio_or_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.my_role() in ('admin', 'socio'), false) $$;

create or replace function public.is_deal_member(p_deal uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.deal_members where deal_id = p_deal and profile_id = auth.uid())
      or exists (select 1 from public.deals where id = p_deal and socio_id = auth.uid())
$$;

create or replace function public.is_project_member(p_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.project_members where project_id = p_project and profile_id = auth.uid())
      or exists (select 1 from public.projects where id = p_project and (lider_id = auth.uid() or socio_id = auth.uid()))
$$;

create or replace function public.is_project_leader(p_project uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.projects where id = p_project and (lider_id = auth.uid() or socio_id = auth.uid()))
      or exists (select 1 from public.project_members where project_id = p_project and profile_id = auth.uid() and papel = 'lider')
$$;

create or replace function public.can_see_deal(p_deal uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.is_socio_or_admin() or (public.is_active_user() and public.is_deal_member(p_deal)) $$;

-- =============================================================
-- Gatilhos
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','companies','contacts','deals','deal_financials','projects','tasks'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rid text;
begin
  rid := coalesce(
    to_jsonb(coalesce(new, old)) ->> 'id',
    to_jsonb(coalesce(new, old)) ->> 'deal_id',
    to_jsonb(coalesce(new, old)) ->> 'email'
  );
  insert into public.audit_log (tabela, registro_id, acao, autor_id, antes, depois)
  values (
    tg_table_name, rid, lower(tg_op), auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','allowed_emails','companies','contacts','deals','deal_financials','interactions','projects','project_members','tasks'] loop
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_row()', t);
  end loop;
end $$;

-- Novo usuário: só entra quem tem e-mail @outfieldinc.com cadastrado em allowed_emails.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv public.allowed_emails;
begin
  select * into inv from public.allowed_emails where email = lower(new.email);
  if inv.email is null then
    raise exception 'Acesso nao autorizado para %', new.email using errcode = '42501';
  end if;
  insert into public.profiles (id, email, nome, role)
  values (new.id, lower(new.email), inv.nome, inv.role)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ninguém se promove: só Admin muda role/ativo; e sempre fica ao menos um Admin ativo.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.ativo is distinct from old.ativo or new.email is distinct from old.email)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'Apenas Admin altera perfil, status ou e-mail' using errcode = '42501';
  end if;
  if old.role = 'admin' and old.ativo and (new.role <> 'admin' or not new.ativo)
     and (select count(*) from public.profiles where role = 'admin' and ativo and id <> old.id) = 0 then
    raise exception 'Precisa haver pelo menos um Admin ativo';
  end if;
  return new;
end $$;

create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- =============================================================
-- RLS
-- =============================================================
alter table public.allowed_emails   enable row level security;
alter table public.profiles         enable row level security;
alter table public.casas_otf        enable row level security;
alter table public.deal_stages      enable row level security;
alter table public.company_types    enable row level security;
alter table public.companies        enable row level security;
alter table public.contacts         enable row level security;
alter table public.deals            enable row level security;
alter table public.deal_financials  enable row level security;
alter table public.deal_members     enable row level security;
alter table public.deal_contacts    enable row level security;
alter table public.interactions     enable row level security;
alter table public.projects         enable row level security;
alter table public.project_members  enable row level security;
alter table public.tasks            enable row level security;
alter table public.audit_log        enable row level security;

-- Usuários
create policy allowed_emails_admin on public.allowed_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy profiles_select on public.profiles for select to authenticated using (public.is_active_user());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Listas: todos leem, Admin edita
create policy casas_select on public.casas_otf for select to authenticated using (public.is_active_user());
create policy casas_admin on public.casas_otf for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy stages_select on public.deal_stages for select to authenticated using (public.is_active_user());
create policy stages_admin on public.deal_stages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ctypes_select on public.company_types for select to authenticated using (public.is_active_user());
create policy ctypes_admin on public.company_types for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Empresas e contatos: todos veem, criam e editam; só Admin exclui
create policy companies_select on public.companies for select to authenticated using (public.is_active_user());
create policy companies_insert on public.companies for insert to authenticated with check (public.is_active_user());
create policy companies_update on public.companies for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy companies_delete on public.companies for delete to authenticated using (public.is_admin());

create policy contacts_select on public.contacts for select to authenticated using (public.is_active_user());
create policy contacts_insert on public.contacts for insert to authenticated with check (public.is_active_user());
create policy contacts_update on public.contacts for update to authenticated using (public.is_active_user()) with check (public.is_active_user());
create policy contacts_delete on public.contacts for delete to authenticated using (public.is_admin());

-- Interações: todos veem; cada um edita as próprias; Admin tudo
create policy interactions_select on public.interactions for select to authenticated
  using (public.is_active_user() and (deal_id is null or public.can_see_deal(deal_id)));
create policy interactions_insert on public.interactions for insert to authenticated
  with check (public.is_active_user() and autor_id = auth.uid() and (deal_id is null or public.can_see_deal(deal_id)));
create policy interactions_update on public.interactions for update to authenticated
  using (autor_id = auth.uid() or public.is_admin()) with check (autor_id = auth.uid() or public.is_admin());
create policy interactions_delete on public.interactions for delete to authenticated
  using (autor_id = auth.uid() or public.is_admin());

-- Negociações: Admin/Sócio tudo; Equipe só vê as que integra
create policy deals_select on public.deals for select to authenticated using (public.can_see_deal(id));
create policy deals_insert on public.deals for insert to authenticated with check (public.is_socio_or_admin());
create policy deals_update on public.deals for update to authenticated using (public.is_socio_or_admin()) with check (public.is_socio_or_admin());
create policy deals_delete on public.deals for delete to authenticated using (public.is_admin());

create policy deal_fin_all on public.deal_financials for all to authenticated
  using (public.is_socio_or_admin()) with check (public.is_socio_or_admin());

create policy deal_members_select on public.deal_members for select to authenticated using (public.can_see_deal(deal_id));
create policy deal_members_write on public.deal_members for all to authenticated
  using (public.is_socio_or_admin()) with check (public.is_socio_or_admin());
create policy deal_contacts_select on public.deal_contacts for select to authenticated using (public.can_see_deal(deal_id));
create policy deal_contacts_write on public.deal_contacts for all to authenticated
  using (public.is_socio_or_admin()) with check (public.is_socio_or_admin());

-- Projetos: todos veem (inclusive receita e impostos); edita quem integra; Admin tudo
create policy projects_select on public.projects for select to authenticated using (public.is_active_user());
create policy projects_insert on public.projects for insert to authenticated with check (public.is_socio_or_admin());
create policy projects_update on public.projects for update to authenticated
  using (public.is_admin() or public.is_project_member(id))
  with check (public.is_admin() or public.is_project_member(id));
create policy projects_delete on public.projects for delete to authenticated using (public.is_admin());

create policy project_members_select on public.project_members for select to authenticated using (public.is_active_user());
create policy project_members_write on public.project_members for all to authenticated
  using (public.is_admin() or (public.is_socio_or_admin() and public.is_project_member(project_id)) or public.is_project_leader(project_id))
  with check (public.is_admin() or (public.is_socio_or_admin() and public.is_project_member(project_id)) or public.is_project_leader(project_id));

-- Tarefas
create policy tasks_select on public.tasks for select to authenticated using (
  public.is_admin()
  or (project_id is not null and public.is_project_member(project_id))
  or (project_id is null and (created_by = auth.uid() or responsavel_id = auth.uid()))
);
create policy tasks_insert on public.tasks for insert to authenticated with check (
  public.is_admin()
  or (project_id is not null and public.is_project_member(project_id))
  or (project_id is null and public.is_active_user())
);
create policy tasks_update on public.tasks for update to authenticated using (
  public.is_admin()
  or (project_id is not null and public.is_project_member(project_id)
      and (public.my_role() = 'socio' or public.is_project_leader(project_id) or responsavel_id = auth.uid()))
  or (project_id is null and (created_by = auth.uid() or responsavel_id = auth.uid()))
) with check (public.is_active_user());
create policy tasks_delete on public.tasks for delete to authenticated using (
  public.is_admin()
  or created_by = auth.uid()
  or (project_id is not null and public.is_project_leader(project_id))
);

-- Auditoria: só Admin lê
create policy audit_admin on public.audit_log for select to authenticated using (public.is_admin());

-- =============================================================
-- Dados iniciais
-- =============================================================
insert into public.casas_otf (codigo, nome) values
  ('01', 'Plano de Negócios'),
  ('02', 'M&A, ECM e DCM'),
  ('03', 'Fan Insights & IA'),
  ('04', 'Gestão Completa / Comercial / Associativa'),
  ('05', 'SSDV'),
  ('06', 'Assessment'),
  ('07', 'Suporte ao Depto de Futebol');

insert into public.deal_stages (nome, ordem, tipo) values
  ('Lead', 1, 'aberta'),
  ('Primeira reunião', 2, 'aberta'),
  ('Diagnóstico', 3, 'aberta'),
  ('Proposta enviada', 4, 'aberta'),
  ('Negociação', 5, 'aberta'),
  ('Ganha', 6, 'ganha'),
  ('Perdida', 7, 'perdida');

insert into public.company_types (nome) values
  ('Clube'), ('SAF'), ('Investidor'), ('Patrocinador'), ('Agência'), ('Federação / Liga'), ('Outro');

-- Primeiro Admin. Os demais usuários são cadastrados pela tela de Admin.
insert into public.allowed_emails (email, nome, role) values
  ('raphael.ancona@outfieldinc.com', 'Rapha Ancona', 'admin');
