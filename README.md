# CRM Outfield

App interno da Outfield Strategies: contatos, pipeline de vendas, projetos e tarefas.
Stack: Next.js (App Router) + Supabase (Postgres, Auth, RLS) + Vercel.

## Status

| Entrega | Escopo | Status |
| --- | --- | --- |
| 1 · Fundação | Login Google @outfieldinc.com, perfis Admin/Sócio/Equipe, RLS, tela de Admin, schema completo | ✅ código pronto |
| 2 · Contatos | Empresas, contatos, interações, busca, importação CSV | — |
| 3 · Vendas | Pipeline kanban, valores protegidos, Ganha → Projeto | — |
| 4 · Projetos e tarefas | Projetos, equipe, kanban de tarefas, dashboard | — |

## Perfis de acesso

As regras ficam no banco (Row Level Security), não só na tela.

- **Admin**: tudo, inclusive usuários e configurações.
- **Sócio**: vê tudo; edita negociações e os projetos que integra.
- **Equipe**: vê empresas, contatos e todos os projetos (com receita e impostos); só vê as negociações que integra e nunca os valores delas; edita as tarefas atribuídas a si.

Só entra quem foi autorizado na tela **Admin** e tem conta Google `@outfieldinc.com`.

## Configuração (uma vez)

### 1. Supabase
1. Crie um projeto em supabase.com (região **South America (São Paulo)**).
2. SQL Editor → cole e rode `supabase/migrations/20261013000000_init.sql`
   (ou `supabase db push` com a CLI).
3. Project Settings → API: copie a **Project URL** e a **anon public key**.

### 2. Login com Google
1. Google Cloud Console (conta @outfieldinc.com) → APIs & Services → OAuth consent screen → tipo **Internal**.
2. Credentials → Create credentials → OAuth client ID → **Web application**.
   - Authorized redirect URI: `https://SEU-PROJETO.supabase.co/auth/v1/callback`
3. Supabase → Authentication → Providers → **Google**: cole Client ID e Client Secret e ative.
4. Supabase → Authentication → URL Configuration:
   - Site URL: a URL de produção da Vercel (ex.: `https://crm.outfieldinc.com`)
   - Redirect URLs: `https://crm.outfieldinc.com/auth/callback`, `https://*.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

### 3. Vercel
1. New Project → importe este repositório.
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy. Cada push na `main` publica em produção; cada branch ganha um link de prévia.

### 4. Primeiro acesso
O e-mail `raphael.ancona@outfieldinc.com` já vem autorizado como Admin. Depois do primeiro login,
cadastre os demais usuários em **Admin**.

## Desenvolvimento

```bash
cp .env.example .env.local   # preencha com as chaves do Supabase
npm install
npm run dev                  # http://localhost:3000
npm run test:rls             # testa as regras de acesso do banco (PGlite, sem servidor)
```
