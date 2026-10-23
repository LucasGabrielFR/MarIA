-- Telemetria de produto do app MarIA.
-- Não armazena texto de conversas, conteúdo espiritual, tokens de sessão ou dados sensíveis.

create table if not exists public.mobile_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in ('session_start', 'session_end', 'screen_view', 'screen_exit', 'app_error')),
  screen_name text,
  session_id text not null,
  platform text,
  app_version text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mobile_analytics_events_occurred_at_idx
  on public.mobile_analytics_events (occurred_at desc);
create index if not exists mobile_analytics_events_user_occurred_at_idx
  on public.mobile_analytics_events (user_id, occurred_at desc);
create index if not exists mobile_analytics_events_screen_idx
  on public.mobile_analytics_events (screen_name, occurred_at desc)
  where screen_name is not null;

alter table public.mobile_analytics_events enable row level security;

-- A escrita é feita exclusivamente pelo backend autenticado com a service role.
revoke all on table public.mobile_analytics_events from anon, authenticated;
