# PocketStrip

Developer-first subscription billing for SaaS. Define plans, drop in the SDK,
and PocketStrip handles checkout, renewals, invoices, and feature access on top
of your payment provider (Stripe today; Paystack for one-time charges).

```
apps/api         Hono API — the backend (port 4000)
apps/dashboard   Next.js dashboard for merchants + customer portal (port 3000)
packages/db      Postgres schema (Drizzle) and migrations
packages/auth    Sign-in / sign-up (better-auth)
packages/providers  Stripe + Paystack adapters behind one interface
packages/sdk     The client your app uses
```

---

## Run it locally

### 1. Prerequisites

- [Bun](https://bun.sh) 1.2+
- [Docker](https://www.docker.com/) (for Postgres), or any Postgres 15+
- A [Stripe](https://dashboard.stripe.com/register) account in **test mode**
- The [Stripe CLI](https://docs.stripe.com/stripe-cli) — lets Stripe's webhooks reach your laptop

### 2. Install and start the database

```bash
bun install
bun run db:up
```

### 3. Configure environment files

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp packages/db/.env.example packages/db/.env
```

Then fill in the two secrets:

- `BETTER_AUTH_SECRET`: the **same** value in both `apps/api/.env.local` and `apps/dashboard/.env.local`
- `PROVIDERS_MASTER_KEY`: in `apps/api/.env.local` only

Generate each one with `openssl rand -base64 32`.

### 4. Create the tables

```bash
bun run db:migrate
```

### 5. Start everything (3 terminals)

```bash
bun run dev:api
```

```bash
bun run dev:dashboard
```

```bash
stripe login
bun run stripe:listen
```

`stripe listen` prints a webhook signing secret (`whsec_…`). Keep it; you'll
paste it into the dashboard in the next section.

Open <http://localhost:3000>.

---

## Try it end to end

1. **Sign up**, then sign in.
2. **Create a project.**
3. **Settings → Connect Stripe.** Paste your Stripe **test** secret key
   (`sk_test_…`, from Stripe → Developers → API keys) and the `whsec_…` from
   `stripe listen`. PocketStrip checks the key with Stripe before saving it encrypted.
4. **Plans → New plan**, e.g. "Pro", 29.00 USD / month, features `reports, seats:5`.
5. **Customers → New customer** with any email.
6. On that customer, click **Checkout**, pick the plan, and pay with test card
   `4242 4242 4242 4242`, any future expiry date, any CVC.
7. Back in the dashboard (refresh if needed):
   - **Customers** shows the subscription as *Active*.
   - **Payments** shows the paid invoice.
   - **Overview** shows your MRR.
8. Click **Portal link** and open it in a new tab to see the customer's view.
   Links are single-use and expire after 15 minutes.
9. Click **Cancel** and choose *at the end of the billing period*.

The Overview page has a **Getting started** checklist that tracks these steps.

### Use the SDK from your own app

Create a key under **Developers**, then follow
[`packages/sdk/README.md`](packages/sdk/README.md). API docs are served at
<http://localhost:4000/docs> and <http://localhost:4000/redoc>.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "No payment provider configured for project" | Connect Stripe under **Settings** first. |
| Paid, but the customer never shows *Active* | `stripe listen` isn't running, or the `whsec_` in Settings doesn't match what it printed. Reconnect with the current value. |
| "Server is missing a valid PROVIDERS_MASTER_KEY" | Set it in `apps/api/.env.local` (32+ characters), then restart the API. |
| Signed in on the dashboard but API calls return 401 | `BETTER_AUTH_SECRET` differs between the API and the dashboard. |
| Stored keys stop working | `PROVIDERS_MASTER_KEY` changed. Restore it, or reconnect the provider. |
| `db:migrate` fails with "relation already exists" | Your database was created with `db:push` earlier. Use a fresh database, or see `packages/db/README.md`. |

## Known limitations

- **Paystack** supports one-time charges only; recurring renewals need the Plans
  redesign tracked in issue #16. Use Stripe for subscription testing.
- PocketStrip sends **no emails** yet.
- No hosted instance yet. In production, set `API_URL` / `DASHBOARD_URL` to your
  real domains and add `{API_URL}/webhooks/stripe` as a webhook endpoint in Stripe.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run db:up` / `db:down` | Start / stop local Postgres |
| `bun run db:migrate` | Apply database migrations |
| `bun run dev:api` | API on :4000 |
| `bun run dev:dashboard` | Dashboard on :3000 |
| `bun run stripe:listen` | Forward Stripe webhooks to the local API |
| `bun run typecheck` | Type-check every package |
| `bun run test` | Unit tests (database tests are opt-in via `RUN_DB_TESTS=1`) |
