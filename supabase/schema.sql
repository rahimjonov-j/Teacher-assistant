create extension if not exists "pgcrypto";

create type app_role as enum ('teacher', 'admin');
create type feature_key as enum ('quiz', 'lesson_plan', 'writing_feedback', 'speaking_questions', 'pdf_export');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.plans (
  key text primary key,
  name text not null,
  monthly_credits integer not null check (monthly_credits >= 0),
  price_monthly_uzs numeric(12,0) not null check (price_monthly_uzs >= 0),
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.plans (key, name, monthly_credits, price_monthly_uzs, description)
values
  ('free_trial', 'Free Trial', 12, 0, 'Explore the platform with a real classroom trial allocation.'),
  ('basic', 'Basic', 80, 120000, 'Regular planning and quick classroom support.'),
  ('pro', 'Pro', 220, 240000, 'Balanced for weekly planning, feedback, and exports.'),
  ('premium', 'Premium', 520, 490000, 'For high-usage teachers and department workflows.')
on conflict (key) do update
set
  name = excluded.name,
  monthly_credits = excluded.monthly_credits,
  price_monthly_uzs = excluded.price_monthly_uzs,
  description = excluded.description;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  school_name text,
  grade_focus text,
  telegram_handle text,
  avatar_url text,
  timezone text,
  role app_role not null default 'teacher',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_key text not null references public.plans (key),
  status subscription_status not null default 'trialing',
  credits_total integer not null check (credits_total >= 0),
  credits_remaining integer not null check (credits_remaining >= 0),
  credits_used integer not null default 0 check (credits_used >= 0),
  started_at timestamptz not null default timezone('utc', now()),
  renews_at timestamptz,
  external_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  telegram_user_id text unique,
  telegram_username text,
  link_code text unique,
  expires_at timestamptz,
  linked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generated_contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  feature_key feature_key not null,
  prompt text not null,
  output_markdown text not null,
  level text,
  additional_instructions text,
  model_name text not null,
  credits_consumed integer not null default 0,
  source text not null default 'web',
  pdf_url text,
  pdf_storage_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.file_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  generated_content_id uuid references public.generated_contents (id) on delete cascade,
  bucket_name text not null,
  storage_path text not null,
  public_url text,
  mime_type text not null,
  bytes bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  generated_content_id uuid references public.generated_contents (id) on delete set null,
  feature_key feature_key not null,
  credits_consumed integer not null default 0,
  model_name text not null,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_name text not null,
  event_group text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id, status);
create index if not exists idx_usage_logs_user_id on public.usage_logs (user_id, created_at desc);
create index if not exists idx_usage_logs_feature_key on public.usage_logs (feature_key, created_at desc);
create index if not exists idx_generated_contents_user_id on public.generated_contents (user_id, created_at desc);
create index if not exists idx_generated_contents_feature_key on public.generated_contents (feature_key);
create index if not exists idx_event_logs_group on public.event_logs (event_group, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists set_generated_contents_updated_at on public.generated_contents;
create trigger set_generated_contents_updated_at
before update on public.generated_contents
for each row
execute function public.set_updated_at();

drop trigger if exists set_telegram_links_updated_at on public.telegram_links;
create trigger set_telegram_links_updated_at
before update on public.telegram_links
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.generated_contents enable row level security;
alter table public.file_assets enable row level security;
alter table public.telegram_links enable row level security;
alter table public.usage_logs enable row level security;
alter table public.event_logs enable row level security;
alter table public.admin_roles enable row level security;

create policy "teachers can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "teachers can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

create policy "teachers can view own subscriptions"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create policy "teachers can view own content"
on public.generated_contents
for select
to authenticated
using (auth.uid() = user_id);

create policy "teachers can view own assets"
on public.file_assets
for select
to authenticated
using (auth.uid() = user_id);

create policy "teachers can view own telegram link"
on public.telegram_links
for select
to authenticated
using (auth.uid() = user_id);

create policy "teachers can view own usage"
on public.usage_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "admins can view everything"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1 from public.admin_roles where admin_roles.user_id = auth.uid()
  )
);

create policy "admins can view subscriptions"
on public.subscriptions
for select
to authenticated
using (
  exists (
    select 1 from public.admin_roles where admin_roles.user_id = auth.uid()
  )
);

create policy "admins can view content"
on public.generated_contents
for select
to authenticated
using (
  exists (
    select 1 from public.admin_roles where admin_roles.user_id = auth.uid()
  )
);

create policy "admins can view usage"
on public.usage_logs
for select
to authenticated
using (
  exists (
    select 1 from public.admin_roles where admin_roles.user_id = auth.uid()
  )
);

create policy "admins can view events"
on public.event_logs
for select
to authenticated
using (
  exists (
    select 1 from public.admin_roles where admin_roles.user_id = auth.uid()
  )
);
