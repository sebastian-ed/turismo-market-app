-- Radar de Prioridades Turísticas
-- Backend Supabase para encuesta pública + panel admin privado.

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
  government_level text not null check (government_level in ('Municipal', 'Provincial', 'Nacional', 'Ente mixto / público-privado', 'Otro')),
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

create index if not exists idx_tourism_responses_created_at on public.tourism_market_responses (created_at desc);
create index if not exists idx_tourism_responses_government_level on public.tourism_market_responses (government_level);
create index if not exists idx_tourism_responses_province on public.tourism_market_responses (province);
create index if not exists idx_tourism_responses_top_problems on public.tourism_market_responses using gin (top_problems);
create index if not exists idx_tourism_responses_desired_services on public.tourism_market_responses using gin (desired_services);

alter table public.tourism_market_responses enable row level security;

-- La encuesta pública puede insertar respuestas sin login.
drop policy if exists "Public can insert survey responses" on public.tourism_market_responses;
create policy "Public can insert survey responses"
on public.tourism_market_responses
for insert
to anon, authenticated
with check (true);

-- El panel admin requiere usuario autenticado en Supabase Auth.
drop policy if exists "Authenticated users can read survey responses" on public.tourism_market_responses;
create policy "Authenticated users can read survey responses"
on public.tourism_market_responses
for select
to authenticated
using (auth.uid() is not null);

-- Opcional: permitir borrar respuestas desde SQL/Supabase, no desde la app.
-- No se crea política de update/delete desde frontend.

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
