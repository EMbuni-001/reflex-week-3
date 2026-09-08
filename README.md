# Reflex

**Reflex** is a live delivery-management prototype built for small Kenyan retailers — electronics shops, pharmacies, hardware stores — who currently coordinate deliveries by WhatsApp and phone calls.

**🔗 Live app:** https://reflex-delivery.vercel.app
**🔗 Live API:** https://reflex-backend-n6jy.onrender.com

---

## Why We Built Reflex

Walk into almost any small retailer in Nairobi handling its own deliveries, and the process looks the same: a staff member takes an order, calls or WhatsApps a rider, and hopes the message doesn't get lost in a group chat with forty other things happening in it. There's no record anyone can point to later. No one can say with confidence which of today's twelve orders are still sitting at the shop and which are already on a bike. When a customer calls asking "where's my order," the answer is usually "let me call the rider and find out" — not something anyone can just look up.

That's the actual problem Reflex solves. Not a hypothetical one — this is how delivery coordination works today for shops that are too small to justify (or afford) a full logistics platform, but too busy to keep tolerating chaos.

Reflex gives these shops one shared, live view of every delivery: who created it, who it's assigned to, what state it's in right now, and proof — an actual QR-code scan, not just someone's word — that it was delivered. Three people can look at the same delivery at the same time and see the same, current truth, without anyone needing to ask anyone else.

We built it as a **prototype**, deliberately scoped: no GPS tracking, no route optimization, no payments, no SMS gateway. Just the core loop, done properly — because a small, reliable tool that actually gets used beats a large one that doesn't.

---

## The Core Workflow

```
Retailer Staff  →  Create Delivery  →  Dispatcher Assigns Rider  →  Rider Updates Status  →  Everyone Sees It Live
```

Every step is visible to everyone who needs to see it, the moment it happens — no refreshing, no calling around to ask.

---

## User Roles

### Retailer Staff
Logs in, creates a delivery (customer name, phone, address, item description), and can check on its status and details at any time.

### Dispatcher
Logs in, sees deliveries waiting to be assigned (or everything, with a filter toggle), sees which riders are available, and assigns — or reassigns — a rider to a delivery.

### Rider
Logs in, sees only the deliveries assigned to them, updates status as they progress (picked up → out for delivery), and confirms the final handoff by scanning the delivery's QR code with their phone's camera.

There is deliberately **no "admin" or "developer" role** baked into the app itself. Team members needing to test a given role's functionality use dedicated test accounts for that role — building an in-app superuser would have undermined the same server-side authorization model everything else relies on.

---

## The Delivery Lifecycle

```
PENDING → ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
```

Also supported:
```
ASSIGNED → CANCELLED
ASSIGNED → PENDING   (dispatcher reassignment reset)
```

Every single transition is validated on the **backend**, not trusted from whatever the app's UI happens to show. The server keeps a strict lookup table of which status can move to which next status, and which role is allowed to make that specific move — a Rider can move a delivery forward, a Dispatcher can cancel or reassign it, and neither can do the other's job. Anything outside that table is rejected outright.

**`DELIVERED` is special.** It cannot be reached through the normal "update status" action at all — the only way a delivery becomes `DELIVERED` is by a rider actually scanning its QR code and the backend independently confirming that scan is legitimate. "Delivered" in Reflex always means someone proved it, not just clicked a button.

---

## What's Actually Built

- **Role-based login** — real authentication (Supabase Auth), with the backend independently re-checking who you are and what role you have on every single request. The app never just trusts what the frontend claims about you.
- **Delivery creation** — full customer/address/item details, an automatically generated unique tracking code, always starting at `PENDING`.
- **Assignment & reassignment** — a Dispatcher picks a rider from the available list; deliveries can be reassigned right up until a rider has picked them up.
- **Status updates** — riders move a delivery forward through the workflow with one clear action at a time.
- **Live updates, everywhere** — when a delivery changes, every dashboard watching it updates on its own. No one has to hit refresh to find out something happened.
- **QR-code confirmation** — every delivery gets a scannable code; a rider scans it with their phone camera, and the backend checks it's the right delivery, the right rider, and the right moment in the process before marking it delivered.
- **A full history for every delivery** — created, assigned, picked up, out for delivery, delivered (or cancelled) — each entry showing what happened, who did it, and when, laid out as a simple timeline.

---

## How It's Built

```
React (Vite + Tailwind + React Router)
                ↓
        Node.js + Express API
                ↓
   PostgreSQL via Supabase (+ live updates)
```

**Frontend:** React 19, Vite, React Router, Tailwind CSS, React Hook Form, `qrcode` (generating QR codes), `html5-qrcode` (scanning them via the camera), and a lightweight Supabase real-time connection used *only* to know "something changed, go check again" — never as a source of actual delivery data.

**Backend:** Node.js + Express, structured so each concern lives in its own place — routes define endpoints, controllers handle requests, services hold the actual business logic, middleware handles authentication/authorization/errors, and validators check incoming data before anything touches the database.

**Database:** PostgreSQL through Supabase. Three tables — `users`, `deliveries`, `delivery_events`. Riders are simply `users` with `role = 'RIDER'`; there's no separate riders table, since that would just duplicate the same information.

Row-level security is deliberately switched off on all three tables — the Express backend, using Supabase's elevated service-role key, is the single, sole authority deciding who can see or change what. Every request already passes through real authentication and role checks before it ever touches the database, so a second layer of database-level rules would just be duplicating logic that's already correctly enforced elsewhere.

---

## API

| Method | Endpoint | What it does |
|---|---|---|
| `POST` | `/api/auth/login` | Log in, get back a token and your profile |
| `GET` | `/api/deliveries` | Your deliveries — scoped to your role automatically |
| `POST` | `/api/deliveries` | Create a delivery (Retailer only) |
| `GET` | `/api/deliveries/:id` | One delivery's full details |
| `PATCH` | `/api/deliveries/:id/assign` | Assign or reassign a rider (Dispatcher only) |
| `PATCH` | `/api/deliveries/:id/status` | Move a delivery to its next status |
| `POST` | `/api/deliveries/:id/confirm` | Confirm delivery via a scanned QR code (Rider only) |
| `GET` | `/api/deliveries/:id/events` | The full event history for one delivery |
| `GET` | `/api/riders` | Available riders (Dispatcher only) |
| `GET` | `/api/dashboard` | A quick summary count, scoped to your role |

Nothing exists outside this list. Every error comes back in the same shape: `{ "error": "a clear message" }`.

---

## Frontend Routes

| Route | Who it's for |
|---|---|
| `/` , `/login`, `/register` | Anyone |
| `/retailer/dashboard`, `/retailer/deliveries/new`, `/retailer/deliveries/:id` | Retailer Staff |
| `/dispatcher/dashboard`, `/dispatcher/deliveries/:id` | Dispatcher |
| `/rider/dashboard`, `/rider/deliveries/:id`, `/rider/scan` | Rider |

If someone's logged in but tries to visit a page that isn't theirs, they see a clear "you don't have access to this" message — not a confusing redirect, and not the real page's content either. And regardless of what the interface shows or hides, the backend enforces the exact same rules independently on every request, so hiding a button is never the actual security.

---

## Security, Plainly

- We never touch or store raw passwords — Supabase Auth owns that entirely.
- Every request is independently authenticated and authorized on the server, not just the browser.
- A user's role is read fresh from the database on every request — never cached, never trusted from what the client claims.
- All incoming data is validated server-side before it's acted on.
- The powerful Supabase service-role key lives only on the backend and never reaches the browser. The frontend only ever holds the public, restricted anon key.
- QR confirmation checks the right delivery, the right rider, and the right status — in that order — before anything is marked delivered.
- Both the live frontend and backend run over HTTPS.

---

## Deployment

| Layer | Where | Branch |
|---|---|---|
| Frontend | [Vercel](https://reflex-delivery.vercel.app) | `main` |
| Backend | [Render](https://reflex-backend-n6jy.onrender.com) | `main` |
| Database + real-time | Supabase | — |

Both the frontend and backend redeploy automatically whenever `main` is updated.

### Environment variables

**Backend** (never committed):
```
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

**Frontend** (never committed):
```
VITE_API_BASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The frontend's Supabase values use the public anon key and are safe to expose in a browser. The backend's service-role key must never leave the server.

**One important thing we learned the hard way:** if the frontend is ever deployed without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set, the entire app fails to render — not just the real-time features, the *whole page goes blank*, because the app crashes while first loading, before anything can even appear on screen. If a deployment ever shows a blank white page, check these two variables first.

---

## Running It Yourself

1. Clone the repo. Run `npm install` inside both `server/` and `client/`.
2. Set up both `.env` files as shown above, pointing at your own Supabase project.
3. Run the SQL migration files in `server/db/` against that project, in order, and make sure Row Level Security is switched off on all three tables.
4. Start the backend: `npm start` inside `server/`.
5. Start the frontend: `npm run dev` inside `client/`.
6. Log in with a seeded test account for whichever role you want to try.

### Checks
```
cd server && npm test        # backend test suite (mocked, no real credentials touched)
cd client && npm run build   # confirms the frontend builds cleanly
cd client && npm run lint    # code-quality check
```

---

## Test Accounts

Real accounts exist for each role for development and QA — see `server/db/TEST_ACCOUNTS.md` for how to obtain the current password safely. Several rider accounts exist specifically to test assignment and reassignment between different riders.

There's no self-service way to create a Dispatcher or Rider account (only Retailer Staff can register themselves) — adding one means creating the account in Supabase directly and giving it the right role, documented step by step in that same file.

---

## What We Deliberately Didn't Build

These aren't gaps — they're a line we drew on purpose, so the prototype stayed something we could actually finish and trust:

- Full GPS tracking
- Route optimization
- Payments
- A customer-facing mobile app
- SMS or WhatsApp integration
- Complex analytics
- Multi-company / enterprise administration
- Fleet management tools

They're reasonable next steps for a future version — just not part of proving out the core idea.

---

## Honest Limitations

A few things worth knowing rather than glossing over:

- A delivery's assigned rider currently shows as an internal ID rather than a friendly name on a couple of screens (the event timeline resolves a real name; the delivery record's own summary doesn't yet).
- Automated tests cover login, permissions, the full delivery lifecycle, and QR confirmation thoroughly, but don't yet directly test the riders list, dashboard summary, or list-level scoping endpoints.
- A reusable "are you sure?" confirmation component exists in the codebase but isn't wired into any specific action yet (e.g., before cancelling a delivery).
- Real-time notifications are intentionally lightweight — they only ever say "something changed, go check again," and the app always re-fetches the real data through the properly secured API rather than trusting the notification's contents directly. This was a deliberate simplicity trade-off, made explicitly rather than by accident.

---

*Reflex was built to prove a simple idea: that a small retailer doesn't need an enterprise logistics platform to stop losing track of its own deliveries — it just needs one shared, honest, live view that everyone can trust.*