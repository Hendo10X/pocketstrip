import { Hono } from "hono";
import { db, plans, customers } from "@pocketstrip/db";
import { paymentProvider } from "../lib/provider";
import { eq, and } from "drizzle-orm";
import type { Variables } from "../types";
import { requireProjectAccess } from "../middleware/requireProjectAccess";

const app = new Hono<{ Variables: Variables }>();

app.post("/:projectId/checkout", requireProjectAccess, async (c) => {
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

    const result = await paymentProvider.createCheckout({
        customerEmail: customer.email,
        planName: plan.name,
        priceInMinorUnits: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval as "month" | "year",
        trialDays: plan.trialDays,
        successUrl: `${process.env.DASHBOARD_URL}/checkout/success`,
        cancelUrl: `${process.env.DASHBOARD_URL}/checkout/cancelled`,
        metadata: {
            projectId,
            customerId: customer.id,
            planId: plan.id,
        },
    });

    return c.json(result, 201);
});

export default app;
