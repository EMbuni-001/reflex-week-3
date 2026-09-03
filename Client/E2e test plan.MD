# Reflex — End-to-End QA Test Plan (D3-9)

**Status as of this document: NOT YET RUNNABLE.** This plan
exists so the full scenario can be executed the moment the
missing pieces (listed per step below) exist. It has not been
run, and no step below should be treated as passed until it has
actually been executed against real, deployed (or at least
fully running local) frontend + backend + Supabase, per
`AI-RULES.md` §12 and §25.

Source: `PROJECT_SPEC.md` §27 (Final Success Criterion) and
§21.1 (End-to-End Test), which describe the same sequence.

---

## Blocking gaps as of this document (must close before this plan can run)

| Gap | Owner | Related task |
|---|---|---|
| No router connecting any pages into one app | Dev 1 | D1-1 |
| No login page / real Supabase Auth wiring | Dev 1 | D1-3 |
| No Retailer dashboard / delivery creation form | Dev 1 | D1-5, D1-6 |
| No real backend (all 10 endpoints) | Dev 2 | D2-1 through D2-15 |
| No Dispatcher dashboard / assignment UI | Dev 2 (tentative, per Phase 0 ownership note) | D2-18, D2-19 |
| Supabase real-time replication not enabled | Dev 2 | D2-16 |
| Real Supabase project (auth, tables, seed data) | Whole team | Phase 0 seed-user decision |

Until these exist, only the Rider-owned slice of this scenario
can be verified in isolation — see
`src/test/integration/RiderWorkflow.integration.test.jsx` for
that (component-level, mocked-backend) coverage.

---

## Step-by-step plan

Each row is a literal step from `PROJECT_SPEC.md` §27. "Ready?"
reflects whether the step can be executed *today* against real
running software — not against my mocks.

| # | Step (PROJECT_SPEC §27) | Depends on | Ready? |
|---|---|---|---|
| 1 | Log in as Retailer | D1-1, D1-3, D2-4, D2-5 | ❌ No login page, no backend |
| 2 | Create delivery | D1-6, D2-9 | ❌ No Retailer UI, no backend |
| 3 | Log in / view as Dispatcher | D1-4, D2-6, D2-18 | ❌ No Dispatcher UI |
| 4 | Assign rider | D2-19, D2-11 | ❌ No assignment UI/endpoint |
| 5 | View as Rider | D1-4, **D3-1** ✅ | ⚠️ Rider UI exists, but only reachable if a session/token is manually injected — no login flow to reach it normally |
| 6 | Update status | **D3-2** ✅, D2-12 | ⚠️ UI exists and is unit-tested; real backend validation (D2-12) doesn't exist |
| 7 | Scan QR | **D3-3** ✅, **D3-4** ✅ | ⚠️ Works at component level (per unit tests, not yet executed even those); needs a real device test still outstanding from D3-4 |
| 8 | Confirm delivery | **D3-5** ✅ | ⚠️ UI exists and is unit-tested against mocked responses; real backend confirm endpoint (D2-15) doesn't exist, and its exact contract is still an unconfirmed assumption (flagged in `deliveries.js`) |
| 9 | Return to Dispatcher, observe updated status | D2-18, D2-16, **D3-6** ✅ (Rider side only) | ❌ No Dispatcher UI to observe anything with |
| 10 | Inspect event history | **D3-7** ✅ | ⚠️ Timeline component exists, wired into Rider view, unit-tested; needs a real backend events endpoint to show real data |

**Legend:** ✅ = my (Dev 3) piece exists and is unit-tested (not yet actually executed due to sandbox network restrictions). ⚠️ = partially ready, blocked on another developer's piece. ❌ = not startable yet.

---

## What to do when the gaps above close

1. Re-run this checklist top to bottom against the real deployed (or fully-running local) app — not against any mock.
2. Use the Phase 0-agreed seed users (Retailer, Dispatcher, at least one Rider) so results are reproducible across the team.
3. For any step that fails, **do not fix it by rewriting another developer's owned files.** Per this task's own integration note and `AI-RULES.md` §9.5, report the failure back to the owning developer:
   - Steps 1–4, 9 → Dev 1 / Dev 2 (per the tentative Dispatcher-frontend ownership split, confirm at time of failure)
   - Steps 6, 8 (backend half) → Dev 2
   - Steps 5, 6 (frontend half), 7, 8 (frontend half), 10 → Dev 3 (me) — if my own piece fails against a real backend, that's mine to fix
4. Record the actual pass/fail result of each step here, with a date and who ran it, before declaring the MVP demo-ready (`README.md` "Project Status" / `PROJECT_SPEC.md` §23 Acceptance Criteria).

---

## Explicit statement of what this document is NOT

This is a plan and a gap analysis, not a completed test report. No
step above has been executed against real software. Treating any
row marked ❌ or ⚠️ as "passing" would misrepresent the project's
actual state.