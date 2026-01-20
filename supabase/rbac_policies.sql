-- Enable RLS on core tables
alter table cities enable row level security;
alter table companies enable row level security;

-- POLICY: Admins have full access to Cities
create policy "Admins can manage cities"
on cities
to authenticated
using ( (auth.jwt() ->> 'role') = 'admin' )
with check ( (auth.jwt() ->> 'role') = 'admin' );

-- POLICY: Everyone can view Cities (needed for dropdowns)
create policy "Everyone can view cities"
on cities for select
to authenticated
using ( true );

-- POLICY: Admins have full access to Companies
create policy "Admins can manage companies"
on companies
to authenticated
using ( (auth.jwt() ->> 'role') = 'admin' )
with check ( (auth.jwt() ->> 'role') = 'admin' );
