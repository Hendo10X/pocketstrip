import { Hono } from "hono";
import { db, plans, planFeatures } from "@pocketstrip/db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

app.post("/:projectId/plans", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();

    if (!body.name || typeof body.price !== "number" || !body.billingInterval) {
        return c.json(
            { error: "name, price, and billingInterval are required" },
            400,
        );
    }

    if (!Number.isInteger(body.price) || body.price < 0) {
        return c.json(
            { error: "price must be a non-negative integer (minor units)" },
            400,
        );
    }

    if (!["month", "year"].includes(body.billingInterval)) {
        return c.json(
            { error: "billingInterval must be 'month' or 'year'" },
            400,
        );
    }

    const slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

    try {
        const [plan] = await db
            .insert(plans)
            .values({
                projectId,
                name: body.name,
                slug,
                price: body.price,
                currency: body.currency ?? "usd",
                billingInterval: body.billingInterval,
                trialDays: body.trialDays ?? 0,
                isPublic: body.isPublic ?? true,
            })
            .returning();

        if (!plan) {
            return c.json({ error: "Failed to create plan" }, 500);
        }

        // Optional feature grants: [{ key: string, limit?: number }]
        const rawFeatures = Array.isArray(body.features) ? body.features : [];
        const features = rawFeatures
            .filter(
                (f: unknown): f is { key: string; limit?: number } =>
                    !!f && typeof (f as { key?: unknown }).key === "string",
            )
            .map((f: { key: string; limit?: number }) => ({
                planId: plan.id,
                key: f.key,
                limit:
                    typeof f.limit === "number" && Number.isInteger(f.limit)
                        ? f.limit
                        : null,
            }));

        if (features.length > 0) {
            await db.insert(planFeatures).values(features);
        }

        return c.json({ plan, features }, 201);
    } catch (err: any) {
        if (err.cause?.code === "23505") {
            return c.json(
                {
                    error: "A plan with this name already exists in this project",
                },
                409,
            );
        }
        throw err;
    }
});

app.get("/:projectId/plans", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");

    const projectPlans = await db
        .select()
        .from(plans)
        .where(eq(plans.projectId, projectId));

    const planIds = projectPlans.map((p) => p.id);
    const features = planIds.length
        ? await db
              .select()
              .from(planFeatures)
              .where(inArray(planFeatures.planId, planIds))
        : [];

    const byPlan = new Map<string, { key: string; limit: number | null }[]>();
    for (const f of features) {
        const list = byPlan.get(f.planId) ?? [];
        list.push({ key: f.key, limit: f.limit });
        byPlan.set(f.planId, list);
    }

    const withFeatures = projectPlans.map((p) => ({
        ...p,
        features: byPlan.get(p.id) ?? [],
    }));

    return c.json({ plans: withFeatures });
});

export default app;
