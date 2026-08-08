import { Hono } from "hono";
import { db, customers, plans, portalSessions } from "@pocketstrip/db";
import { requireApiKey } from "../middleware/apiKey";
import { getProviderForProject } from "../lib/provider";
import { eq, and, isNull, gt } from "drizzle-orm";
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

export default app;
