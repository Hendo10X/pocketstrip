import { Hono } from "hono";
import { db, plans } from "@pocketstrip/db";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";

const app = new Hono();

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

        return c.json({ plan }, 201);
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

export default app;
