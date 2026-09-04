# Development Test Accounts

Reflex uses real Supabase Auth accounts for development testing. The backend
continues to determine each user's role from the `users` profile; there is no
frontend role switcher or authentication bypass.

Developer 2 provisions the shared development accounts with `server/db/seed.js`.
Send account passwords through a private team channel. Never put passwords,
tokens, service-role keys, or other credentials in Git, issues, or pull requests.

Set these values only in the local server environment:

```text
SUPABASE_URL=your-development-project-url
SUPABASE_SERVICE_ROLE_KEY=your-development-service-role-key
DEMO_RETAILER_PASSWORD=your-private-password
DEMO_DISPATCHER_PASSWORD=your-private-password
DEMO_RIDER1_PASSWORD=your-private-password
DEMO_RIDER2_PASSWORD=your-private-password
```

Then run:

```bash
cd server
npm run seed
```

Use the provisioned credentials through the normal `/login` page. Public
registration creates only `RETAILER_STAFF`; Dispatcher and Rider accounts are
provisioned separately. Never use development credentials with production data.