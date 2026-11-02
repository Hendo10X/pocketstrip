import { Hono } from "hono";
import { db, subscriptions, plans, customers } from "@pocketstrip/db";
import { eq, and, gte, count } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

app.get("/:projectId/analytics", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Active subscriptions with their plan price/interval for MRR.
    const activeSubs = await db
        .select({
            price: plans.price,
            interval: plans.billingInterval,
            currency: plans.currency,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(
            and(
                eq(subscriptions.projectId, projectId),
                eq(subscriptions.status, "active"),
            ),
        );

    // MRR, normalized to monthly minor units (yearly plans counted as price/12).
    const mrr = activeSubs.reduce(
        (sum, s) =>
            sum + (s.interval === "year" ? Math.round(s.price / 12) : s.price),
        0,
    );

    const [
        activeRow,
        trialingRow,
        customersRow,
        newSubsRow,
        newCustomersRow,
    ] = await Promise.all([
        db
            .select({ value: count() })
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.projectId, projectId),
                    eq(subscriptions.status, "active"),
                ),
            ),
        db
            .select({ value: count() })
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.projectId, projectId),
                    eq(subscriptions.status, "trialing"),
                ),
            ),
        db
            .select({ value: count() })
            .from(customers)
            .where(eq(customers.projectId, projectId)),
        db
            .select({ value: count() })
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.projectId, projectId),
                    gte(subscriptions.createdAt, periodStart),
                ),
            ),
        db
            .select({ value: count() })
            .from(customers)
            .where(
                and(
                    eq(customers.projectId, projectId),
                    gte(customers.createdAt, periodStart),
                ),
            ),
    ]);

    return c.json({
        mrr,
        currency: activeSubs[0]?.currency ?? "usd",
        activeSubscriptions: activeRow[0]?.value ?? 0,
        trialingSubscriptions: trialingRow[0]?.value ?? 0,
        totalCustomers: customersRow[0]?.value ?? 0,
        newSubscriptionsThisPeriod: newSubsRow[0]?.value ?? 0,
        newCustomersThisPeriod: newCustomersRow[0]?.value ?? 0,
        periodStart,
    });
});

export default app;
