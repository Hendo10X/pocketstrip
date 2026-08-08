import { Hono } from "hono";
import { db, subscriptions, plans } from "@pocketstrip/db";
import { verifyWebhookForProvider } from "../lib/provider";
import { UnhandledStripeEventError } from "@pocketstrip/providers";
import { eq } from "drizzle-orm";
import { computeNextPeriodEnd } from "./subscriptions";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

async function findSubscriptionByProviderId(providerSubscriptionId: string) {
    const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.providerSubscriptionId, providerSubscriptionId),
    });

    if (!existing) {
        console.error(
            "Webhook referenced unknown subscription:",
            providerSubscriptionId,
        );
    }

    return existing;
}

app.post("/stripe", async (c) => {
    const signature = c.req.header("stripe-signature");

    if (!signature) {
        return c.json({ error: "Missing stripe-signature header" }, 400);
    }

    const rawBody = await c.req.text();

    let event;
    try {
        event = await verifyWebhookForProvider("stripe", rawBody, signature);
    } catch (err) {
        if (err instanceof UnhandledStripeEventError) {
            return c.json({ received: true, ignored: true });
        }
        console.error("Webhook signature verification failed:", err);
        return c.json({ error: "Invalid signature" }, 400);
    }

    switch (event.type) {
        case "checkout.completed": {
            const { projectId, customerId, planId } = event.metadata;

            if (!projectId || !customerId || !planId) {
                console.error(
                    "checkout.completed event missing required metadata",
                    event.metadata,
                );
                break;
            }

            const plan = await db.query.plans.findFirst({
                where: eq(plans.id, planId),
            });
            if (!plan) break;

            const now = new Date();
            const trialEnd =
                plan.trialDays > 0
                    ? new Date(
                          now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000,
                      )
                    : null;
            const currentPeriodEnd =
                trialEnd ?? computeNextPeriodEnd(now, plan.billingInterval);

            await db.insert(subscriptions).values({
                projectId,
                customerId,
                planId,
                status: trialEnd ? "trialing" : "active",
                providerSubscriptionId: event.providerSubscriptionId,
                trialEnd,
                currentPeriodStart: now,
                currentPeriodEnd,
            });
            break;
        }

        case "subscription.renewed": {
            const existing = await findSubscriptionByProviderId(
                event.providerSubscriptionId,
            );
            if (!existing) break;

            const plan = await db.query.plans.findFirst({
                where: eq(plans.id, existing.planId),
            });
            if (!plan) break;

            const newPeriodEnd = computeNextPeriodEnd(
                existing.currentPeriodEnd,
                plan.billingInterval,
            );

            await db
                .update(subscriptions)
                .set({
                    status: "active",
                    currentPeriodStart: existing.currentPeriodEnd,
                    currentPeriodEnd: newPeriodEnd,
                })
                .where(eq(subscriptions.id, existing.id));
            break;
        }

        case "subscription.cancelled": {
            const existing = await findSubscriptionByProviderId(
                event.providerSubscriptionId,
            );
            if (!existing) break;

            await db
                .update(subscriptions)
                .set({ status: "cancelled" })
                .where(eq(subscriptions.id, existing.id));
            break;
        }

        case "payment.failed": {
            const existing = await findSubscriptionByProviderId(
                event.providerSubscriptionId,
            );
            if (!existing) break;

            await db
                .update(subscriptions)
                .set({ status: "past_due" })
                .where(eq(subscriptions.id, existing.id));
            break;
        }
    }

    return c.json({ received: true });
});

export default app;
