import { Hono } from "hono";
import { db, customers } from "@pocketstrip/db";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import { eq } from "drizzle-orm";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

app.post("/:projectId/customers", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();

    if (!body.email || typeof body.email !== "string") {
        return c.json({ error: "email is required" }, 400);
    }

    try {
        const [customer] = await db
            .insert(customers)
            .values({
                projectId,
                email: body.email,
                name: body.name ?? null,
            })
            .returning();

        return c.json({ customer }, 201);
    } catch (err: any) {
        if (err.cause?.code === "23505") {
            return c.json(
                {
                    error: "A customer with this email already exists in this project",
                },
                409,
            );
        }
        throw err;
    }
});

app.get("/:projectId/customers", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");

    const projectCustomers = await db
        .select()
        .from(customers)
        .where(eq(customers.projectId, projectId));

    return c.json({ customers: projectCustomers });
});

export default app;
