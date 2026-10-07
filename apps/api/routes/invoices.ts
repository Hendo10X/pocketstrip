import { Hono } from "hono";
import { db, invoices } from "@pocketstrip/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

app.get("/:projectId/invoices", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");

    const rows = await db
        .select()
        .from(invoices)
        .where(eq(invoices.projectId, projectId))
        .orderBy(desc(invoices.createdAt));

    return c.json({ invoices: rows });
});

app.get(
    "/:projectId/customers/:customerId/invoices",
    requireAuth,
    requireMembership,
    async (c) => {
        const projectId = c.req.param("projectId");
        const customerId = c.req.param("customerId");

        const rows = await db
            .select()
            .from(invoices)
            .where(
                and(
                    eq(invoices.projectId, projectId),
                    eq(invoices.customerId, customerId),
                ),
            )
            .orderBy(desc(invoices.createdAt));

        return c.json({ invoices: rows });
    },
);

export default app;
