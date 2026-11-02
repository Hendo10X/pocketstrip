import { Hono } from "hono";
import { db, subscriptions, plans, customers } from "@pocketstrip/db";
import { eq, and } from "drizzle-orm";
import type { Variables } from "../types";
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import { getProviderForProject } from "../lib/provider";

const app = new Hono<{ Variables: Variables }>();

export function computeNextPeriodEnd(from: Date, interval: string): Date {
    const next = new Date(from);
    if (interval === "month") next.setMonth(next.getMonth() + 1);
    if (interval === "year") next.setFullYear(next.getFullYear() + 1);
    return next;
}

app.post("/:projectId/subscriptions", requireProjectAccess, async (c) => {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();

    if (!body.customerId || !body.planId) {
        return c.json({ error: "customerId and planId are required" }, 400);
    }

    const plan = await db.query.plans.findFirst({
        where: and(eq(plans.id, body.planId), eq(plans.projectId, projectId)),
    });
    if (!plan) return c.json({ error: "Plan not found in this project" }, 404);

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
});

// Cancel a subscription, immediately or at the end of the current period.
app.post(
    "/:projectId/subscriptions/:id/cancel",
    requireProjectAccess,
    async (c) => {
        const projectId = c.req.param("projectId");
        const id = c.req.param("id");
        const body = await c.req.json().catch(() => ({}));
        const atPeriodEnd = body?.atPeriodEnd === true;

        const subscription = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.id, id),
                eq(subscriptions.projectId, projectId),
            ),
        });
        if (!subscription) {
            return c.json({ error: "Subscription not found" }, 404);
        }

        // Tell the provider to cancel (now or at period end) for
        // provider-backed subscriptions; manual subs have no provider id.
        if (subscription.providerSubscriptionId) {
            const provider = await getProviderForProject(projectId);
            await provider.cancelSubscription(
                subscription.providerSubscriptionId,
                { atPeriodEnd },
            );
        }

        const [updated] = await db
            .update(subscriptions)
            .set(
                atPeriodEnd
                    ? { cancelAt: subscription.currentPeriodEnd }
                    : { status: "cancelled", cancelAt: new Date() },
            )
            .where(eq(subscriptions.id, subscription.id))
            .returning();

        return c.json({ subscription: updated });
    },
);

export default app;
