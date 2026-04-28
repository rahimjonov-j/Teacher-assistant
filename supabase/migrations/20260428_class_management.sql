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
