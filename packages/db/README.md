# @pocketstrip/db

Drizzle ORM schema + Postgres client for PocketStrip. Schema lives in
`schema.ts` (business tables) and `auth-schema.ts` (better-auth tables).

## Setup

Set `DATABASE_URL` in `.env` (gitignored):

```bash
DATABASE_URL=postgres://user:pass@host:5432/pocketstrip
```

## Migration workflow

Migrations are the **source of truth** and are committed under `migrations/`.
Do **not** use `db:push` against shared (staging/prod) databases — it drifts
the schema out from under other engineers.

1. Edit `schema.ts` / `auth-schema.ts`.
2. Generate a migration from the diff:
   ```bash
   bun run db:generate
   ```
3. Review the generated SQL in `migrations/`, then commit it with your schema change.
4. Apply pending migrations to your target database:
   ```bash
   bun run db:migrate
   ```

A fresh clone reaches the current schema with `db:migrate` alone.

### Scripts

| Script | Purpose |
| --- | --- |
| `db:generate` | Diff schema → new SQL migration file |
| `db:migrate` | Apply pending migrations |
| `db:push` | Direct schema sync — **local/throwaway DBs only** |
| `db:studio` | Drizzle Studio |

> Note: the `0000` baseline migration reflects the full current schema. An
> existing database that was previously `db:push`-ed already contains these
> tables; reconcile it (e.g. `drizzle-kit push` once to align, or baseline the
> journal) rather than applying `0000` on top.
