-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('admin', 'telemarketer');
create type calling_status as enum ('queued', 'picked_up', 'not_answered', 'not_contactable', 'interested', 'not_interested');
create type eligibility_status as enum ('eligible', 'ineligible', 'pending');

-- 1. Cities
create table public.cities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  short_code text not null unique check (length(short_code) = 3),
  created_at timestamptz default now()
);

-- 2. Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role default 'telemarketer',
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- 3. Companies
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  internal_id text unique,
  city_id uuid not null references public.cities(id),
  result_index serial, -- Auto-increment per table, but logic will handle per city if needed, simplistic approach: global serial or per-city sequence function
  name text not null,
  financial_year text,
  turnover numeric,
  profit numeric,
  borrowed_funds numeric,
  eligibility_status eligibility_status default 'pending',
  board_type text,
  calling_status calling_status default 'queued',
  remarks text,
  website text,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Directors
create table public.directors (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  din_no text,
  name text,
  contact_no text,
  email text,
  email_status text
);

-- Internal ID Generator Function
create or replace function generate_internal_id()
returns trigger as $$
declare
  city_code text;
  city_seq int;
begin
  -- Get city short code
  select short_code into city_code from public.cities where id = new.city_id;
  
  -- Calculate distinct sequence for this city (naive count approach or maintained sequence)
  -- Better: use a dedicated sequence table or count. Here using count + 1 for simplicity (beware concurrency if high volume)
  select count(*) + 1 into city_seq from public.companies where city_id = new.city_id;

  new.internal_id := city_code || '_' || lpad(city_seq::text, 3, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_internal_id
before insert on public.companies
for each row
execute function generate_internal_id();

-- Automatic Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'telemarketer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- RLS Policies
alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.companies enable row level security;
alter table public.directors enable row level security;

-- Profiles: 
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Cities:
create policy "Cities viewable by everyone" on public.cities for select using (true);

-- Companies:
create policy "Admins view all companies" on public.companies for select 
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Telemarketers view assigned companies" on public.companies for select
using (assigned_to = auth.uid());

create policy "Admins update all companies" on public.companies for update
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Telemarketers update assigned companies" on public.companies for update
using (assigned_to = auth.uid());

-- Directors:
create policy "Admins view all directors" on public.directors for select
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Telemarketers view assigned company directors" on public.directors for select
using (exists (select 1 from public.companies where id = company_id and assigned_to = auth.uid()));
