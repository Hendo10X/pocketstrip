import { Hono } from "hono";
import { db, subscriptions, plans, customers } from "@pocketstrip/db";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import { eq, and } from "drizzle-orm";

const app = new Hono();

export function computeNextPeriodEnd(from: Date, interval: string): Date {
    const next = new Date(from);
    if (interval === "month") next.setMonth(next.getMonth() + 1);
    if (interval === "year") next.setFullYear(next.getFullYear() + 1);
    return next;
}

app.post(
    "/:projectId/subscriptions",
    requireAuth,
    requireMembership,
    async (c) => {
        const projectId = c.req.param("projectId");
        const body = await c.req.json();

        if (!body.customerId || !body.planId) {
            return c.json({ error: "customerId and planId are required" }, 400);
        }

        const plan = await db.query.plans.findFirst({
            where: and(
                eq(plans.id, body.planId),
                eq(plans.projectId, projectId),
            ),
        });
        if (!plan)
            return c.json({ error: "Plan not found in this project" }, 404);

        const customer = await db.query.customers.findFirst({
            where: and(
                eq(customers.id, body.customerId),
                eq(customers.projectId, projectId),
            ),
        });
        if (!customer)
            return c.json({ error: "Customer not found in this project" }, 404);

        const now = new Date();
        const trialEnd =
            plan.trialDays > 0
                ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
                : null;
        const status = plan.trialDays > 0 ? "trialing" : "active";
        const currentPeriodEnd =
            trialEnd ?? computeNextPeriodEnd(now, plan.billingInterval);

        const [subscription] = await db
            .insert(subscriptions)
            .values({
                projectId,
                customerId: body.customerId,
                planId: body.planId,
                status,
                trialEnd,
                currentPeriodStart: now,
                currentPeriodEnd,
            })
            .returning();

        return c.json({ subscription }, 201);
    },
);

export default app;
