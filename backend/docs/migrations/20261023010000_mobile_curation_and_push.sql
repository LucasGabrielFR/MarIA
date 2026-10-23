create table if not exists public.mobile_home_highlights (
  id uuid primary key default gen_random_uuid(),
  title varchar(80) not null,
  subtitle varchar(180) not null,
  target_path varchar(80) not null default '/mobile/',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mobile_push_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  installation_id text not null unique,
  platform varchar(12) not null check (platform in ('android', 'ios', 'web')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_push_installations_active_idx
  on public.mobile_push_installations (is_active) where is_active = true;

create table if not exists public.mobile_push_campaigns (
  id uuid primary key default gen_random_uuid(),
  title varchar(80) not null,
  body varchar(240) not null,
  target_path varchar(80) not null default '/mobile/',
  status varchar(12) not null check (status in ('queued', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  failure_count integer not null default 0,
  created_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists mobile_push_campaigns_due_idx
  on public.mobile_push_campaigns (scheduled_at) where status = 'scheduled';

alter table public.mobile_home_highlights enable row level security;
alter table public.mobile_push_installations enable row level security;
alter table public.mobile_push_campaigns enable row level security;

-- A API NestJS lê e escreve com service-role. O app só vê destaques ativos via API.
