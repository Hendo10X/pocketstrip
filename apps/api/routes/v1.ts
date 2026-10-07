import { Hono } from "hono";
import {
    db,
    customers,
    plans,
    portalSessions,
    subscriptions,
    planFeatures,
} from "@pocketstrip/db";
import { requireApiKey } from "../middleware/apiKey";
import { getProviderForProject } from "../lib/provider";
import { eq, and, isNull, gt, inArray } from "drizzle-orm";

const ACTIVE_STATUSES = ["active", "trialing"] as const;
import { randomBytes, createHash } from "crypto";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

app.post("/customers", requireApiKey, async (c) => {
    const project = c.get("project");
    const body = await c.req.json();

    if (!body.email) {
        return c.json({ error: "email is required" }, 400);
    }

    try {
        const [customer] = await db
            .insert(customers)
            .values({
                projectId: project.id,
                email: body.email,
                name: body.name ?? null,
            })
            .returning();

        return c.json({ customer }, 201);
    } catch (err: any) {
        if (err.cause?.code === "23505") {
            return c.json(
                { error: "A customer with this email already exists" },
                409,
            );
        }
        throw err;
    }
});

app.post("/checkout", requireApiKey, async (c) => {
    const project = c.get("project");
    const body = await c.req.json();

    if (!body.customerId || !body.planId) {
        return c.json({ error: "customerId and planId are required" }, 400);
    }

    const plan = await db.query.plans.findFirst({
        where: and(eq(plans.id, body.planId), eq(plans.projectId, project.id)),
    });
    if (!plan) return c.json({ error: "Plan not found" }, 404);

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, body.customerId),
            eq(customers.projectId, project.id),
        ),
    });
    if (!customer) return c.json({ error: "Customer not found" }, 404);

    const provider = await getProviderForProject(project.id);

    const result = await provider.createCheckout({
        customerEmail: customer.email,
        planName: plan.name,
        priceInMinorUnits: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval as "month" | "year",
        trialDays: plan.trialDays,
        successUrl: `${process.env.DASHBOARD_URL}/checkout/success`,
        cancelUrl: `${process.env.DASHBOARD_URL}/checkout/cancelled`,
        metadata: {
            projectId: project.id,
            customerId: customer.id,
            planId: plan.id,
        },
    });

    return c.json(result, 201);
});

app.post("/customers/:customerId/portal-link", requireApiKey, async (c) => {
    const project = c.get("project");
    const customerId = c.req.param("customerId");

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, customerId),
            eq(customers.projectId, project.id),
        ),
    });
    if (!customer) return c.json({ error: "Customer not found" }, 404);

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db
        .insert(portalSessions)
        .values({ customerId: customer.id, tokenHash, expiresAt });

    return c.json({
        portalUrl: `${process.env.DASHBOARD_URL}/portal/${rawToken}`,
    });
});

// Does this customer have access to a given feature? Access = an active or
// trialing subscription whose plan grants the feature key.
app.get("/customers/:customerId/access", requireApiKey, async (c) => {
    const project = c.get("project");
    const customerId = c.req.param("customerId");
    const feature = c.req.query("feature");

    if (!feature) {
        return c.json({ error: "feature query param is required" }, 400);
    }

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, customerId),
            eq(customers.projectId, project.id),
        ),
    });
    if (!customer) return c.json({ error: "Customer not found" }, 404);

    const rows = await db
        .select({
            subId: subscriptions.id,
            status: subscriptions.status,
            featureKey: planFeatures.key,
            featureLimit: planFeatures.limit,
        })
        .from(subscriptions)
        .leftJoin(
            planFeatures,
            and(
                eq(planFeatures.planId, subscriptions.planId),
                eq(planFeatures.key, feature),
            ),
        )
        .where(
            and(
                eq(subscriptions.customerId, customer.id),
                inArray(subscriptions.status, [...ACTIVE_STATUSES]),
            ),
        );

    const first = rows[0];
    if (!first) {
        return c.json({
            hasAccess: false,
            reason: "no_active_subscription",
            limit: null,
            subscription: null,
        });
    }

    const granted = rows.find((r) => r.featureKey !== null);
    if (!granted) {
        return c.json({
            hasAccess: false,
            reason: "feature_not_in_plan",
            limit: null,
            subscription: { id: first.subId, status: first.status },
        });
    }

    return c.json({
        hasAccess: true,
        reason: granted.status === "trialing" ? "on_trial" : "active_subscription",
        limit: granted.featureLimit ?? null,
        subscription: { id: granted.subId, status: granted.status },
    });
});

// The full resolved feature set for a customer, for app-side caching.
app.get("/customers/:customerId/entitlements", requireApiKey, async (c) => {
    const project = c.get("project");
    const customerId = c.req.param("customerId");

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, customerId),
            eq(customers.projectId, project.id),
        ),
    });
    if (!customer) return c.json({ error: "Customer not found" }, 404);

    const rows = await db
        .select({ key: planFeatures.key, limit: planFeatures.limit })
        .from(subscriptions)
        .innerJoin(planFeatures, eq(planFeatures.planId, subscriptions.planId))
        .where(
            and(
                eq(subscriptions.customerId, customer.id),
                inArray(subscriptions.status, [...ACTIVE_STATUSES]),
            ),
        );

    const byKey = new Map<string, number | null>();
    for (const r of rows) {
        if (!byKey.has(r.key)) byKey.set(r.key, r.limit ?? null);
    }
    const features = Array.from(byKey, ([key, limit]) => ({ key, limit }));

    return c.json({ features });
});

export default app;
