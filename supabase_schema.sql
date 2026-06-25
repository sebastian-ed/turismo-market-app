-- Radar de Prioridades Turísticas
-- Backend Supabase para encuesta pública + panel admin privado.
-- Versión editable: contenidos configurables + borrado de respuestas desde admin.

create extension if not exists pgcrypto;

create table if not exists public.tourism_market_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Perfil del respondente / jurisdicción
  respondent_name text,
  email text,
  phone text,
  contact_ok boolean not null default false,
  organization text,
  role_title text not null,
  government_level text not null,
  jurisdiction_name text not null,
  province text,
  destination_type text not null,
  decision_role text not null,

  -- Investigación de mercado / JTBD / hair-on-fire
  top_problems text[] not null default '{}',
  top_problem_other text,
  hair_on_fire text not null,
  current_workaround text,
  jobs_to_be_done text[] not null default '{}',
  success_metric text,
  urgency smallint not null check (urgency between 1 and 5),
  impact smallint not null check (impact between 1 and 5),

  -- Compra / contratación / disposición a pagar
  willingness_to_pay text not null,
  budget_range text,
  buying_timeline text not null,
  desired_services text[] not null default '{}',
  desired_service_other text,
  evidence_notes text,

  -- Datos técnicos
  metadata jsonb not null default '{}'::jsonb,

  constraint chk_top_problems_count check (cardinality(top_problems) between 1 and 4),
  constraint chk_desired_services_count check (cardinality(desired_services) <= 4)
);

-- Migración segura para instalaciones anteriores: se elimina el check rígido del nivel de gobierno,
-- porque ahora las opciones se administran desde el panel y se guardan con IDs internos estables.
alter table public.tourism_market_responses
  drop constraint if exists tourism_market_responses_government_level_check;

create index if not exists idx_tourism_responses_created_at on public.tourism_market_responses (created_at desc);
create index if not exists idx_tourism_responses_government_level on public.tourism_market_responses (government_level);
create index if not exists idx_tourism_responses_province on public.tourism_market_responses (province);
create index if not exists idx_tourism_responses_top_problems on public.tourism_market_responses using gin (top_problems);
create index if not exists idx_tourism_responses_desired_services on public.tourism_market_responses using gin (desired_services);

-- Configuración editable de la encuesta.
-- content guarda textos, labels, placeholders, opciones visibles e instrucciones de la página.
create table if not exists public.tourism_survey_config (
  id text primary key default 'default',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.tourism_survey_config (id, content)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.tourism_market_responses enable row level security;
alter table public.tourism_survey_config enable row level security;

-- La encuesta pública puede insertar respuestas sin login.
drop policy if exists "Public can insert survey responses" on public.tourism_market_responses;
create policy "Public can insert survey responses"
on public.tourism_market_responses
for insert
to anon, authenticated
with check (true);

-- El panel admin requiere usuario autenticado en Supabase Auth para leer resultados.
drop policy if exists "Authenticated users can read survey responses" on public.tourism_market_responses;
create policy "Authenticated users can read survey responses"
on public.tourism_market_responses
for select
to authenticated
using (auth.uid() is not null);

-- El panel admin puede borrar respuestas de prueba, duplicadas o inválidas.
drop policy if exists "Authenticated users can delete survey responses" on public.tourism_market_responses;
create policy "Authenticated users can delete survey responses"
on public.tourism_market_responses
for delete
to authenticated
using (auth.uid() is not null);

-- La configuración de la encuesta debe poder leerse públicamente para renderizar la encuesta.
drop policy if exists "Public can read survey config" on public.tourism_survey_config;
create policy "Public can read survey config"
on public.tourism_survey_config
for select
to anon, authenticated
using (true);

-- Solo usuarios autenticados pueden crear/actualizar/restaurar la configuración desde el admin.
drop policy if exists "Authenticated users can insert survey config" on public.tourism_survey_config;
create policy "Authenticated users can insert survey config"
on public.tourism_survey_config
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update survey config" on public.tourism_survey_config;
create policy "Authenticated users can update survey config"
on public.tourism_survey_config
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete survey config" on public.tourism_survey_config;
create policy "Authenticated users can delete survey config"
on public.tourism_survey_config
for delete
to authenticated
using (auth.uid() is not null);

-- Grants explícitos para evitar problemas de permisos en proyectos con defaults más restrictivos.
grant insert on public.tourism_market_responses to anon, authenticated;
grant select, delete on public.tourism_market_responses to authenticated;
grant select on public.tourism_survey_config to anon, authenticated;
grant insert, update, delete on public.tourism_survey_config to authenticated;

-- Vista útil para inspección rápida en Supabase.
create or replace view public.v_tourism_market_responses_summary
with (security_invoker = true) as
select
  id,
  created_at,
  government_level,
  jurisdiction_name,
  province,
  destination_type,
  decision_role,
  urgency,
  impact,
  willingness_to_pay,
  buying_timeline,
  top_problems,
  desired_services,
  hair_on_fire
from public.tourism_market_responses
order by created_at desc;

revoke all on public.v_tourism_market_responses_summary from anon, public;
grant select on public.v_tourism_market_responses_summary to authenticated;
