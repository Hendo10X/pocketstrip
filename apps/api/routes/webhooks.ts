import { Hono } from "hono";
import { db, subscriptions, plans } from "@pocketstrip/db";
import { paymentProvider } from "../lib/provider";
import { UnhandledStripeEventError } from "@pocketstrip/providers";
import { eq } from "drizzle-orm";
import { computeNextPeriodEnd } from "./subscriptions";

const app = new Hono();

app.post("/stripe", async (c) => {
    const signature = c.req.header("stripe-signature");

    if (!signature) {
        return c.json({ error: "Missing stripe-signature header" }, 400);
    }

    const rawBody = await c.req.text();

    let event;
    try {
        event = await paymentProvider.verifyWebhook(rawBody, signature);
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
            // next step
            break;
        }

        case "subscription.cancelled": {
            // next step
            break;
        }

        case "payment.failed": {
            // next step
            break;
        }
    }

    return c.json({ received: true });
});

export default app;
