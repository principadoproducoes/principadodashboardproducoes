-- Principado Dashboard — PostgreSQL schema
-- Authentication remains in Clerk. clerk_user_id is the external identity key.

create extension if not exists pgcrypto;

create type project_member_role as enum ('client', 'producer', 'admin');
create type project_status as enum ('planning', 'production', 'event_day', 'completed', 'cancelled');
create type task_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type approval_status as enum ('pending', 'approved', 'rejected');
create type guest_status as enum ('pending', 'confirmed', 'declined', 'maybe');

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  client_id uuid references clients(id) on delete set null,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  name text not null,
  event_type text,
  status project_status not null default 'planning',
  event_date date,
  event_time time,
  city text,
  venue text,
  description text,
  budget_planned numeric(14,2) not null default 0,
  budget_approved numeric(14,2) not null default 0,
  guest_target integer not null default 0,
  guest_confirmed integer not null default 0,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role project_member_role not null default 'client',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  category text,
  status task_status not null default 'pending',
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  milestone_date date not null,
  milestone_time time,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  category text,
  contact_name text,
  email text,
  phone text,
  status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  description text not null,
  category text,
  supplier_id uuid references suppliers(id) on delete set null,
  planned_amount numeric(14,2) not null default 0,
  approved_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  approval approval_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  status guest_status not null default 'pending',
  plus_ones integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  content text,
  version integer not null default 1,
  approved approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_user_id uuid references users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  uploaded_by_user_id uuid references users(id) on delete set null,
  name text not null,
  storage_key text not null,
  mime_type text,
  size_bytes bigint,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_clerk_user_id on users(clerk_user_id);
create index if not exists idx_projects_client_id on projects(client_id);
create index if not exists idx_project_members_user_id on project_members(user_id);
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_milestones_project_id_date on milestones(project_id, milestone_date);
create index if not exists idx_suppliers_project_id on suppliers(project_id);
create index if not exists idx_budget_items_project_id on budget_items(project_id);
create index if not exists idx_guests_project_id on guests(project_id);
create index if not exists idx_messages_project_id_created_at on messages(project_id, created_at);
create index if not exists idx_files_project_id on files(project_id);
create index if not exists idx_activity_log_project_id_created_at on activity_log(project_id, created_at);
