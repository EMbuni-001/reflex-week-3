-- delivery_events
-- Matches PROJECT_SPEC.md §11.3 exactly.
-- Records the audit trail required by §6.7 (created, assigned, picked up, etc.)

create table public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  event_type text not null,
  performed_by uuid not null references public.users(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);