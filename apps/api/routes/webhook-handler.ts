import { db, subscriptions, plans, webhookEvents } from "@pocketstrip/db";
import { eq } from "drizzle-orm";
import { computeNextPeriodEnd } from "./subscriptions";
import type { VerifiedWebhookEvent } from "@pocketstrip/providers";

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

/**
 * Idempotently applies a normalized webhook event to our data model.
 *
 * The provider's event id is recorded in the `webhook_events` ledger before any
 * processing. Providers retry deliveries, so a duplicate lands here, hits the
 * unique constraint, and is skipped — retried events never double-process
 * (which previously produced duplicate subscriptions). Shared by every provider
 * webhook route so the logic lives in exactly one place.
 */
export async function handleVerifiedEvent(
    provider: string,
    event: VerifiedWebhookEvent,
): Promise<{ received: true; duplicate?: boolean }> {
    const [ledgerRow] = await db
        .insert(webhookEvents)
        .values({
            provider,
            providerEventId: event.providerEventId,
            type: event.type,
            payload: JSON.stringify(event.raw),
        })
        .onConflictDoNothing({ target: webhookEvents.providerEventId })
        .returning();

    if (!ledgerRow) {
        return { received: true, duplicate: true };
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

            await db
                .insert(subscriptions)
                .values({
                    projectId,
                    customerId,
                    planId,
                    status: trialEnd ? "trialing" : "active",
                    providerSubscriptionId: event.providerSubscriptionId,
                    trialEnd,
                    currentPeriodStart: now,
                    currentPeriodEnd,
                })
                // Defense-in-depth: even if the same provider subscription
                // arrives twice, the partial unique index keeps it to one row.
                .onConflictDoNothing();
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

    return { received: true };
}
