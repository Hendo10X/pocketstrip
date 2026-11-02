import { Hono } from "hono";
import { db, customers, subscriptions, plans } from "@pocketstrip/db";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import { and, desc, eq } from "drizzle-orm";
import type { Variables } from "../types";
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import { createPortalLink } from "../lib/portal";

const app = new Hono<{ Variables: Variables }>();

app.post("/:projectId/customers", requireProjectAccess, async (c) => {
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

// Customers with their most recent subscription (status + plan), so the
// dashboard can show who is paying at a glance.
app.get("/:projectId/customers", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");

    const [projectCustomers, projectSubs] = await Promise.all([
        db
            .select()
            .from(customers)
            .where(eq(customers.projectId, projectId))
            .orderBy(desc(customers.createdAt)),
        db
            .select({
                customerId: subscriptions.customerId,
                id: subscriptions.id,
                status: subscriptions.status,
                currentPeriodEnd: subscriptions.currentPeriodEnd,
                cancelAt: subscriptions.cancelAt,
                planName: plans.name,
            })
            .from(subscriptions)
            .innerJoin(plans, eq(subscriptions.planId, plans.id))
            .where(eq(subscriptions.projectId, projectId))
            .orderBy(desc(subscriptions.createdAt)),
    ]);

    // Subs are newest-first, so the first one seen per customer is the latest.
    const latestByCustomer = new Map<string, (typeof projectSubs)[number]>();
    for (const sub of projectSubs) {
        if (!latestByCustomer.has(sub.customerId)) {
            latestByCustomer.set(sub.customerId, sub);
        }
    }

    return c.json({
        customers: projectCustomers.map((customer) => {
            const sub = latestByCustomer.get(customer.id);
            return {
                ...customer,
                subscription: sub
                    ? {
                          id: sub.id,
                          status: sub.status,
                          planName: sub.planName,
                          currentPeriodEnd: sub.currentPeriodEnd,
                          cancelAt: sub.cancelAt,
                      }
                    : null,
            };
        }),
    });
});

// Generate a single-use customer portal link (dashboard or API key).
app.post(
    "/:projectId/customers/:customerId/portal-link",
    requireProjectAccess,
    async (c) => {
        const projectId = c.req.param("projectId");
        const customerId = c.req.param("customerId");

        const customer = await db.query.customers.findFirst({
            where: and(
                eq(customers.id, customerId),
                eq(customers.projectId, projectId),
            ),
        });
        if (!customer) return c.json({ error: "Customer not found" }, 404);

        return c.json(await createPortalLink(customer.id));
    },
);

export default app;
