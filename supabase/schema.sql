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

do $$
begin
  create type public.class_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.student_status as enum ('active', 'inactive', 'transferred');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.assignment_type as enum (
    'multiple_choice',
    'variant_test',
    'open_question',
    'writing',
    'speaking',
    'mini_game'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.assignment_status as enum ('draft', 'sent', 'closed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.submission_status as enum ('assigned', 'in_progress', 'submitted', 'graded', 'blocked');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.teachers (
  id uuid primary key references public.profiles (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.class_groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  grade_level text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (teacher_id, name)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_group_id uuid references public.class_groups (id) on delete set null,
  name text not null,
  grade_level text,
  group_name text not null,
  status public.class_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (teacher_id, name, group_name)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete restrict,
  full_name text not null,
  login text not null unique,
  password_hash text not null,
  password_salt text not null,
  password_ciphertext text,
  status public.student_status not null default 'active',
  last_active_at timestamptz,
  completed_assignments_count integer not null default 0 check (completed_assignments_count >= 0),
  all_time_score numeric(12,2) not null default 0 check (all_time_score >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.student_class_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  from_class_id uuid references public.classes (id) on delete set null,
  to_class_id uuid not null references public.classes (id) on delete restrict,
  transferred_by uuid not null references public.profiles (id) on delete cascade,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  title text not null,
  description text,
  type public.assignment_type not null,
  status public.assignment_status not null default 'draft',
  points_per_correct numeric(8,2) not null default 1 check (points_per_correct >= 0),
  deadline_at timestamptz,
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes > 0),
  max_attempts integer not null default 2 check (max_attempts > 0),
  randomize_questions boolean not null default false,
  randomize_options boolean not null default false,
  game_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  question_text text not null,
  variant_key text,
  position integer not null default 0,
  points numeric(8,2),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assignment_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.assignment_questions (id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assignment_recipients (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  assigned_at timestamptz not null default timezone('utc', now()),
  unique (assignment_id, student_id)
);

create table if not exists public.student_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  submitted_at timestamptz,
  is_suspicious boolean not null default false,
  suspicious_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (assignment_id, student_id, attempt_number)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  attempt_id uuid references public.student_attempts (id) on delete set null,
  status public.submission_status not null default 'submitted',
  answers jsonb not null default '{}'::jsonb,
  score_awarded numeric(10,2) not null default 0 check (score_awarded >= 0),
  max_score numeric(10,2) not null default 0 check (max_score >= 0),
  feedback text,
  graded_by uuid references public.profiles (id) on delete set null,
  graded_at timestamptz,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.writing_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  text_content text not null,
  word_count integer not null default 0 check (word_count >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.speaking_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  audio_url text,
  storage_path text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  telegram_file_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete set null,
  submission_id uuid references public.submissions (id) on delete set null,
  score numeric(10,2) not null check (score >= 0),
  source text not null check (source in ('auto', 'teacher', 'game')),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monthly_ratings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  period_month date not null,
  total_score numeric(12,2) not null default 0 check (total_score >= 0),
  completed_tasks_count integer not null default 0 check (completed_tasks_count >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (student_id, period_month)
);

create table if not exists public.rating_history (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  period_month date not null,
  total_score numeric(12,2) not null default 0,
  rank_position integer,
  completed_tasks_count integer not null default 0,
  archived_at timestamptz not null default timezone('utc', now()),
  unique (student_id, period_month)
);

create table if not exists public.telegram_accounts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles (id) on delete cascade,
  student_id uuid references public.students (id) on delete cascade,
  telegram_user_id text not null unique,
  telegram_username text,
  login_code text unique,
  code_expires_at timestamptz,
  linked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (teacher_id is not null and student_id is null)
    or (teacher_id is null and student_id is not null)
  )
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  game_type text not null,
  state jsonb not null default '{}'::jsonb,
  score numeric(10,2) not null default 0 check (score >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_classes_teacher on public.classes (teacher_id, status);
create index if not exists idx_students_teacher_class on public.students (teacher_id, class_id, status);
create index if not exists idx_assignments_teacher_class on public.assignments (teacher_id, class_id, created_at desc);
create index if not exists idx_assignment_recipients_student on public.assignment_recipients (student_id, assigned_at desc);
create index if not exists idx_submissions_student_assignment on public.submissions (student_id, assignment_id, submitted_at desc);
create index if not exists idx_scores_student_created on public.scores (student_id, created_at desc);
create index if not exists idx_monthly_ratings_class_period on public.monthly_ratings (class_id, period_month, total_score desc);
create index if not exists idx_student_attempts_lookup on public.student_attempts (assignment_id, student_id, attempt_number desc);
create index if not exists idx_telegram_accounts_student on public.telegram_accounts (student_id);

drop trigger if exists set_teachers_updated_at on public.teachers;
create trigger set_teachers_updated_at before update on public.teachers for each row execute function public.set_updated_at();

drop trigger if exists set_class_groups_updated_at on public.class_groups;
create trigger set_class_groups_updated_at before update on public.class_groups for each row execute function public.set_updated_at();

drop trigger if exists set_classes_updated_at on public.classes;
create trigger set_classes_updated_at before update on public.classes for each row execute function public.set_updated_at();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at before update on public.students for each row execute function public.set_updated_at();

drop trigger if exists set_assignments_updated_at on public.assignments;
create trigger set_assignments_updated_at before update on public.assignments for each row execute function public.set_updated_at();

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at before update on public.submissions for each row execute function public.set_updated_at();

drop trigger if exists set_telegram_accounts_updated_at on public.telegram_accounts;
create trigger set_telegram_accounts_updated_at before update on public.telegram_accounts for each row execute function public.set_updated_at();

drop trigger if exists set_game_sessions_updated_at on public.game_sessions;
create trigger set_game_sessions_updated_at before update on public.game_sessions for each row execute function public.set_updated_at();

alter table public.teachers enable row level security;
alter table public.class_groups enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.student_class_history enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.assignment_options enable row level security;
alter table public.assignment_recipients enable row level security;
alter table public.student_attempts enable row level security;
alter table public.submissions enable row level security;
alter table public.writing_submissions enable row level security;
alter table public.speaking_submissions enable row level security;
alter table public.scores enable row level security;
alter table public.monthly_ratings enable row level security;
alter table public.rating_history enable row level security;
alter table public.telegram_accounts enable row level security;
alter table public.game_sessions enable row level security;
