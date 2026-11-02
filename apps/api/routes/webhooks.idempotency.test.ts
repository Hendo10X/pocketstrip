import { describe, it, expect, afterAll } from "bun:test";
import { db, webhookEvents } from "@pocketstrip/db";
import { eq } from "drizzle-orm";

// Integration test for the webhook idempotency ledger (#4).
//
// It talks to a real Postgres, so it is opt-in: point DATABASE_URL at a
// throwaway/test database and run with RUN_DB_TESTS=1.
//
//   RUN_DB_TESTS=1 DATABASE_URL=postgres://... bun test
//
// Without RUN_DB_TESTS it is skipped, so CI/dev without a DB stays green.
const RUN = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!RUN)("webhook idempotency ledger", () => {
    const eventId = `evt_test_${crypto.randomUUID()}`;

    async function recordEvent() {
        const [row] = await db
            .insert(webhookEvents)
            .values({
                provider: "stripe",
                providerEventId: eventId,
                type: "checkout.completed",
                payload: "{}",
            })
            .onConflictDoNothing({ target: webhookEvents.providerEventId })
            .returning();
        return row;
    }

    afterAll(async () => {
        await db
            .delete(webhookEvents)
            .where(eq(webhookEvents.providerEventId, eventId));
    });

    it("records a new provider event id", async () => {
        const row = await recordEvent();
        expect(row).toBeDefined();
        expect(row?.providerEventId).toBe(eventId);
    });

    it("returns no row on a duplicate delivery (short-circuit)", async () => {
        // Same event id again — the unique constraint makes this a no-op,
        // which is how the handler detects a retry and skips re-processing.
        const row = await recordEvent();
        expect(row).toBeUndefined();
    });

    it("keeps exactly one ledger row for the event id", async () => {
        const rows = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.providerEventId, eventId));
        expect(rows).toHaveLength(1);
    });
});
