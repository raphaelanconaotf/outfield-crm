import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const db = new PGlite();
const migration = fs.readFileSync(new URL("../migrations/20261013000000_init.sql", import.meta.url), 'utf8');

await db.exec(`
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated;
  grant execute on function auth.uid() to authenticated;
`);
await db.exec(migration);
await db.exec(`
  grant usage on schema public to authenticated;
  grant all on all tables in schema public to authenticated;
  grant all on all sequences in schema public to authenticated;
`);

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  ok  ', msg); } else { fail++; console.log('  FAIL', msg); } };
const as = async (uid, sql, params) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role authenticated;`);
  try { return { rows: (await db.query(sql, params)).rows }; }
  catch (e) { return { error: e.message }; }
  finally { await db.exec('reset role;'); }
};
const su = async (sql) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); return (await db.query(sql)).rows; };

// signup
const [rapha] = await su(`insert into auth.users (email) values ('Raphael.Ancona@outfieldinc.com') returning id`);
ok((await su(`select role from profiles where id = '${rapha.id}'`))[0]?.role === 'admin', 'Rapha vira admin no primeiro login');
let blocked = false;
try { await su(`insert into auth.users (email) values ('intruso@gmail.com')`); } catch { blocked = true; }
ok(blocked, 'e-mail fora da lista é bloqueado');
blocked = false;
try { await su(`insert into auth.users (email) values ('naocadastrado@outfieldinc.com')`); } catch { blocked = true; }
ok(blocked, 'e-mail do domínio mas não cadastrado é bloqueado');

// admin cadastra
let r = await as(rapha.id, `insert into allowed_emails (email, nome, role) values ('aline@outfieldinc.com','Aline','equipe'), ('lucas@outfieldinc.com','Lucas','socio') returning email`);
ok(!r.error && r.rows.length === 2, 'admin cadastra e-mails autorizados ' + (r.error ?? ''));
const [aline] = await su(`insert into auth.users (email) values ('aline@outfieldinc.com') returning id`);
const [lucas] = await su(`insert into auth.users (email) values ('lucas@outfieldinc.com') returning id`);

r = await as(aline.id, `select * from allowed_emails`);
ok(r.rows?.length === 0, 'equipe não vê lista de autorizados');
r = await as(aline.id, `update profiles set role = 'admin' where id = '${aline.id}'`);
ok(!!r.error, 'equipe não se promove a admin');
r = await as(aline.id, `update profiles set cargo = 'Analista' where id = '${aline.id}' returning cargo`);
ok(r.rows?.[0]?.cargo === 'Analista', 'usuário edita o próprio cargo');

// dados
r = await as(aline.id, `insert into companies (nome) values ('Criciúma EC') returning id`);
ok(!r.error, 'equipe cria empresa ' + (r.error ?? ''));
const companyId = r.rows?.[0]?.id;
r = await as(aline.id, `delete from companies where id = '${companyId}' returning id`);
ok(r.rows?.length === 0, 'equipe não exclui empresa');

r = await as(aline.id, `insert into deals (titulo, stage_id) values ('X', 1) returning id`);
ok(!!r.error, 'equipe não cria negociação');
r = await as(lucas.id, `insert into deals (titulo, stage_id, company_id) values ('Plano de negócios Criciúma', 4, '${companyId}') returning id`);
ok(!r.error, 'sócio cria negociação ' + (r.error ?? ''));
const dealId = r.rows?.[0]?.id;
r = await as(lucas.id, `insert into deal_financials (deal_id, valor_estimado, probabilidade) values ('${dealId}', 450000, 60) returning deal_id`);
ok(!r.error, 'sócio registra valor ' + (r.error ?? ''));

r = await as(aline.id, `select * from deals`);
ok(r.rows?.length === 0, 'equipe não vê negociação que não integra');
await as(lucas.id, `insert into deal_members values ('${dealId}', '${aline.id}')`);
r = await as(aline.id, `select * from deals`);
ok(r.rows?.length === 1, 'equipe vê negociação que integra');
r = await as(aline.id, `select * from deal_financials`);
ok(r.rows?.length === 0, 'equipe não vê valores de negociação');
r = await as(rapha.id, `select * from deal_financials`);
ok(r.rows?.length === 1, 'admin vê valores de negociação');

// projetos
r = await as(lucas.id, `insert into projects (nome, deal_id, valor_contrato, impostos, socio_id) values ('Criciúma PN', '${dealId}', 450000, 65000, '${lucas.id}') returning id`);
ok(!r.error, 'sócio cria projeto ' + (r.error ?? ''));
const projId = r.rows?.[0]?.id;
r = await as(aline.id, `select valor_contrato, impostos from projects`);
ok(r.rows?.[0]?.valor_contrato == 450000, 'equipe vê receita e impostos do projeto');
r = await as(aline.id, `update projects set fase = 'Diagnóstico' where id = '${projId}' returning id`);
ok(r.rows?.length === 0, 'equipe não edita projeto que não integra');
await as(lucas.id, `insert into project_members values ('${projId}', '${aline.id}', 'membro')`);
r = await as(aline.id, `update projects set fase = 'Diagnóstico' where id = '${projId}' returning id`);
ok(r.rows?.length === 1, 'equipe edita projeto que integra');

// tarefas
r = await as(lucas.id, `insert into tasks (titulo, project_id, responsavel_id) values ('Modelo financeiro', '${projId}', '${aline.id}'), ('Deck', '${projId}', '${lucas.id}') returning id`);
ok(!r.error, 'sócio cria tarefas ' + (r.error ?? ''));
r = await as(aline.id, `update tasks set status = 'fazendo' where project_id = '${projId}' returning titulo`);
ok(r.rows?.length === 1 && r.rows[0].titulo === 'Modelo financeiro', 'equipe só move a própria tarefa');
r = await as(aline.id, `insert into tasks (titulo) values ('Tarefa interna') returning id`);
ok(!r.error, 'equipe cria tarefa interna ' + (r.error ?? ''));
r = await as(lucas.id, `select titulo from tasks where project_id is null`);
ok(r.rows?.length === 0, 'tarefa interna é privada');

// audit
r = await as(rapha.id, `select count(*)::int n from audit_log`);
ok(r.rows?.[0]?.n > 5, 'auditoria registra alterações');
r = await as(aline.id, `select count(*)::int n from audit_log`);
ok(r.rows?.[0]?.n === 0, 'equipe não lê auditoria');

// último admin
r = await as(rapha.id, `update profiles set role = 'equipe' where id = '${rapha.id}'`);
ok(!!r.error, 'não dá para remover o último admin');

console.log(`\n${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
