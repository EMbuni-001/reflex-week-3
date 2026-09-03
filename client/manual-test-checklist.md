# Reflex — D1.11 Manual Test Checklist: Retailer Flow

## Why this document exists

D1.11 asks for a manual test pass of the retailer flow **against a live backend**.
That requires a real, running instance of Developer 2's endpoints
(`POST /api/auth/login`, `POST /api/deliveries`, `GET /api/deliveries`,
`GET /api/deliveries/:id`) connected to the actual frontend — something
Claude cannot access or fabricate (see `AI-RULES.md` §12). This checklist
is the concrete substitute: a ready-to-run test script for whoever
executes it once both pieces are actually integrated (locally in a
Codespace, or against a shared/staging deployment).

**This has not been run yet.** Every checkbox below is unchecked until a
human actually performs the step against a real backend.

---

## Prerequisites

- [ ] Backend running and reachable — URL: ________________________
- [ ] Frontend running and reachable — URL: ________________________
- [ ] `frontend/.env`'s `VITE_API_BASE_URL` points at the correct backend
- [ ] At least one Retailer Staff test account exists (per the team's
      locked Phase 0 decision: Supabase seed script)
- [ ] Browser dev tools open to the Network tab — several steps below
      specifically ask you to inspect the actual request/response
      payloads against the assumptions documented in the frontend code

---

## 1. Login (D1.6)

- [ ] Navigate to `/login`
- [ ] Enter valid Retailer Staff credentials, submit
  - Expected: redirected to `/retailer/dashboard`
  - Expected: Navbar shows the logged-in user's name and role
  - Actual result: ________________________________________________

- [ ] Attempt login with invalid credentials
  - Expected: inline error message shown (not a silent failure)
  - Actual result: ________________________________________________

- [ ] Refresh the page while logged in
  - Expected: session persists — you are NOT redirected to `/login`
    (tests `AuthContext`'s `localStorage` session restoration, D1.6)
  - Actual result: ________________________________________________

---

## 2. Create Delivery (D1.8)

- [ ] Navigate to `/retailer/deliveries/new`
- [ ] Submit the form with one or more required fields left empty
  - Expected: client-side validation blocks submission with inline
    messages under each invalid field (D1.10)
  - Actual result: ________________________________________________

- [ ] Fill in all four fields (customer name, customer phone, address,
      item description) with valid data, submit
  - Expected: redirected to `/retailer/deliveries/:id` for the newly
    created delivery
  - **Critical check:** open the Network tab and confirm the actual
    request body field names match what the frontend sends —
    `customerName`, `customerPhone`, `address`, `itemDescription`.
    This is the single highest-risk integration point flagged
    throughout D1.8. If Developer 2's endpoint expects different
    field names (e.g. `snake_case`), this step will surface it
    immediately.
  - Actual result: ________________________________________________

---

## 3. View Dashboard (D1.7)

- [ ] Navigate to `/retailer/dashboard`
  - Expected: the delivery just created appears in the table with
    status "Pending"
  - Expected: "Unassigned" shown in the rider column
  - Actual result: ________________________________________________

- [ ] Click the delivery's row
  - Expected: navigates to `/retailer/deliveries/:id`
  - Actual result: ________________________________________________

---

## 4. View Delivery Detail (D1.9)

- [ ] Confirm all fields display correctly: customer name, phone,
      address, item description, tracking code, status badge,
      "Unassigned" rider, created timestamp
  - Actual result: ________________________________________________

- [ ] Confirm the QR code and Delivery Timeline sections show their
      placeholder text
  - Expected: this IS expected at this stage — those two sections are
    reserved integration slots for Developer 3's D3.3/D3.4 components,
    not yet built as of D1.9
  - Actual result: ________________________________________________

---

## 5. Error Handling (D1.10)

- [ ] Temporarily stop the backend (or disconnect network), then try
      to reload the dashboard
  - Expected: "Network error. Please check your connection and try
    again." message with a retry button
  - Actual result: ________________________________________________

- [ ] Restart the backend, click "Try again"
  - Expected: data loads successfully
  - Actual result: ________________________________________________

---

## Contract Mismatches Found

List any discrepancy between what the frontend assumes and what the
backend actually returns. Report these to Developer 2 immediately, per
this task's integration note — do not silently patch around them on
the frontend without flagging the mismatch first.

-
-
-

---

## Sign-off

- [ ] All steps above pass
- Tested by: ________________________
- Date: ________________________
- Environment tested against (local / staging / production URL):
  ________________________________________________

---

## Scope note

This checklist covers the retailer-owned portion of `PROJECT_SPEC.md`
§21.1's end-to-end test only. The full end-to-end scenario (dispatcher
assignment, rider status updates, QR scan/confirm) requires Developer 2
and Developer 3's pieces and is out of scope for D1.11.
