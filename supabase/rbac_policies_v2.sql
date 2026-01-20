-- FIX: Drop old policies first to avoid conflicts if you ran the previous script
drop policy if exists "Admins can manage cities" on cities;
drop policy if exists "Everyone can view cities" on cities;
drop policy if exists "Admins can manage companies" on companies;

-- Enable RLS (idempotent)
alter table cities enable row level security;
alter table companies enable row level security;

-- POLICY: Admins have full access to Cities
-- core change: checking 'app_role' instead of 'role'
create policy "Admins can manage cities"
on cities
to authenticated
using ( (auth.jwt() ->> 'app_role') = 'admin' )
with check ( (auth.jwt() ->> 'app_role') = 'admin' );

-- POLICY: Everyone can view Cities
create policy "Everyone can view cities"
on cities for select
to authenticated
using ( true );

-- POLICY: Admins have full access to Companies
create policy "Admins can manage companies"
on companies
to authenticated
using ( (auth.jwt() ->> 'app_role') = 'admin' )
with check ( (auth.jwt() ->> 'app_role') = 'admin' );
