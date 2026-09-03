-- deliveries
-- Matches PROJECT_SPEC.md §11.2 exactly.
-- tracking_code is the QR payload (locked Phase 0 decision) — must be unique.

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  item_description text not null,
  status text not null default 'PENDING'
    check (status in (
      'PENDING',
      'ASSIGNED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    )),
  created_by uuid not null references public.users(id),
  assigned_rider_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);