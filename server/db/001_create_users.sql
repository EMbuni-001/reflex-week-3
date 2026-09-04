-- public.users
-- Extends Supabase's built-in auth.users with the app-specific fields
-- required by PROJECT_SPEC.md §11.1 (name, phone, role).
-- Riders are represented as users with role = 'RIDER' (locked Phase 0 decision) —
-- there is no separate riders table.

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  role text not null check (role in ('RETAILER_STAFF', 'DISPATCHER', 'RIDER')),
  created_at timestamptz not null default now()
);