# Reflex — Developer/Test Accounts

This document explains how the three-person Reflex team tests all three
user roles (RETAILER_STAFF, DISPATCHER, RIDER) without exposing real
credentials in the Git repository.

## Why this exists

PROJECT_SPEC.md and AI-RULES.md require role-based authentication to be
tested for all three roles. Since Reflex has no self-registration
endpoint, test accounts must be created ahead of time in Supabase.

## What exists

Three test accounts currently exist in the shared Supabase project,
one per role:

| Role            | Email                        |
|-----------------|-------------------------------|
| RETAILER_STAFF  | test@reflex.dev               |
| DISPATCHER      | dispatcher-test@reflex.dev    |
| RIDER           | rider-test@reflex.dev         |

Each account has:
- A row in Supabase Auth (`auth.users`), created via the Supabase
  dashboard with "Auto Confirm User" enabled so no email verification
  step is required.
- A matching row in `public.users` (see `server/db/001_create_users.sql`)
  with the correct `role` value, linked via a shared `id`.

## How to get the password

**The password is intentionally NOT written in this file or anywhere
else in the repository**, per AI-RULES.md §5.1 and this task's explicit
"never commit passwords" requirement.

To get the current shared dev/test password:
- Ask a teammate directly (Slack/in person), or
- If you have Supabase dashboard access, you can reset any test
  account's password yourself via Authentication → Users → select the
  user → reset/set password.

## Using the test accounts locally

1. Add the password to your own local `server/.env` (already
   git-ignored) under a variable name of your choice — this repo does
   not require a specific variable for it, since the accounts are used
   by calling `POST /api/auth/login` like any other login, not read
   from environment variables by the backend itself.
2. Log in via `POST /api/auth/login` with the email/password above to
   get a real JWT for that role, exactly as any real user would.

## Creating additional test accounts

If you need another test user (e.g., a second Rider to test
reassignment scenarios):

1. Supabase Dashboard → Authentication → Users → Add user.
   - Check "Auto Confirm User" so it's immediately usable.
2. Copy the generated user `id`.
3. Insert a matching profile row:
```sql
   insert into public.users (id, name, email, phone, role)
   values ('paste-uuid-here', 'Some Name', 'some-email@reflex.dev', '0700000000', 'ROLE_HERE');
```
   `ROLE_HERE` must be one of `RETAILER_STAFF`, `DISPATCHER`, `RIDER`.

## Important — this is a development-only pattern

- There is no frontend or backend mechanism that lets a user choose or
  switch their own role. Role is always read from `public.users`,
  which only a developer with Supabase access can edit directly.
- No "test mode" flag or role-switcher exists anywhere in the
  codebase. Authentication and authorization always go through the
  real `authenticate`/`authorize` middleware, using real Supabase-issued
  JWTs — these test accounts are ordinary users, not a bypass.