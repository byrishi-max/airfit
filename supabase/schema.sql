-- AirFit Supabase schema
-- Run this in the Supabase SQL editor before enabling Supabase-backed app data.

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  name text not null,
  email text not null unique,
  phone text not null unique,
  plan_status text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(client_id) on delete cascade,
  plan_type text not null check (plan_type in ('workout', 'diet')),
  status text not null default 'none',
  workout_json jsonb,
  diet_html text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, plan_type)
);

create table if not exists public.exercise_progress (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(client_id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  week_number integer not null,
  day_name text not null,
  exercise_name text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (client_id, week_number, day_name, exercise_name)
);

create table if not exists public.day_progress (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(client_id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  week_number integer not null,
  day_name text not null,
  done boolean not null default false,
  done_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (client_id, week_number, day_name)
);

create table if not exists public.calorie_logs (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(client_id) on delete cascade,
  log_date date not null,
  food text not null,
  calories integer not null,
  created_at timestamptz not null default now()
);

create index if not exists clients_phone_idx on public.clients (phone);
create index if not exists clients_email_idx on public.clients (email);
create index if not exists plans_client_type_idx on public.plans (client_id, plan_type);
create index if not exists exercise_progress_client_week_idx on public.exercise_progress (client_id, week_number);
create index if not exists exercise_progress_plan_id_idx on public.exercise_progress (plan_id);
create index if not exists day_progress_client_week_idx on public.day_progress (client_id, week_number);
create index if not exists day_progress_plan_id_idx on public.day_progress (plan_id);
create index if not exists calorie_logs_client_date_idx on public.calorie_logs (client_id, log_date);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end $$;

alter table public.clients enable row level security;
alter table public.plans enable row level security;
alter table public.exercise_progress enable row level security;
alter table public.day_progress enable row level security;
alter table public.calorie_logs enable row level security;

grant select, insert, update, delete on public.clients to anon;
grant select, insert, update, delete on public.plans to anon;
grant select, insert, update, delete on public.exercise_progress to anon;
grant select, insert, update, delete on public.day_progress to anon;
grant select, insert on public.calorie_logs to anon;

-- These policies support the existing client-side admin-password and phone-login app.
-- For stronger production privacy, move admin/client operations behind Supabase Auth
-- or trusted server endpoints and replace these anonymous policies.
create policy "anon_clients_select_insert_update"
  on public.clients for all to anon using (true) with check (true);

create policy "anon_plans_select_insert_update"
  on public.plans for all to anon using (true) with check (true);

create policy "anon_exercise_progress_select_insert_update"
  on public.exercise_progress for all to anon using (true) with check (true);

create policy "anon_day_progress_select_insert_update"
  on public.day_progress for all to anon using (true) with check (true);

create policy "anon_calorie_logs_select_insert"
  on public.calorie_logs for select to anon using (true);

create policy "anon_calorie_logs_insert"
  on public.calorie_logs for insert to anon with check (true);
