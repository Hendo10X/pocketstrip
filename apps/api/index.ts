import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import {
    db,
    portalSessions,
    customers,
    subscriptions,
    plans,
} from "@pocketstrip/db";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createHash } from "crypto";
// import { z } from "zod";
import projectsRoute from "./routes/projects";
import plansRoute from "./routes/plans";
import customersRoute from "./routes/customers";
import checkoutRoute from "./routes/checkout";
import stripeWebhookRoute from "./routes/stripe-webhook";
import paystackWebhookRoute from "./routes/paystack-webhook";
import apiKeysRoute from "./routes/api-keys";
import v1Route from "./routes/v1";
import { requireApiKey } from "./middleware/apiKey";
import type { Variables } from "./types";

const app = new OpenAPIHono<{ Variables: Variables }>();

app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
        version: "1.0.0",
        title: "Pocketstrip API",
        description: "Subscription management API for Pocketstrip",
        contact: {
            name: "Pocketstrip Support",
        },
    },
    servers: [
        {
            url: process.env.API_URL ?? "http://localhost:4000",
            description: "API Server",
        },
    ],
});

app.use(
    "*",
    cors({
        origin: process.env.DASHBOARD_URL ?? "http://localhost:3000",
        credentials: true,
    }),
);

// Swagger UI Documentation
app.get("/docs", swaggerUI({ url: "/openapi.json" }));
app.get("/redoc", (c) => {
    return c.html(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Pocketstrip API - ReDoc</title>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
                <style>
                    body { margin: 0; padding: 0; }
                </style>
            </head>
            <body>
                <redoc spec-url='/openapi.json'></redoc>
                <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
            </body>
        </html>
    `);
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/test-api-key", requireApiKey, (c) => {
    const project = c.get("project");
    return c.json({ message: "Valid key!", project: project.name });
});

app.get("/portal/:token", async (c) => {
    const rawToken = c.req.param("token");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const [session] = await db
        .update(portalSessions)
        .set({ usedAt: new Date() })
        .where(
            and(
                eq(portalSessions.tokenHash, tokenHash),
                isNull(portalSessions.usedAt),
                gt(portalSessions.expiresAt, new Date()),
            ),
        )
        .returning();

    if (!session) {
        return c.json(
            { error: "This link is invalid, expired, or already used" },
            401,
        );
    }

    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, session.customerId),
    });

    if (!customer) {
        return c.json({ error: "Customer not found" }, 404);
    }

    const customerSubscriptions = await db
        .select({
            id: subscriptions.id,
            status: subscriptions.status,
            currentPeriodEnd: subscriptions.currentPeriodEnd,
            cancelAt: subscriptions.cancelAt,
            planName: plans.name,
            price: plans.price,
            currency: plans.currency,
            billingInterval: plans.billingInterval,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(subscriptions.customerId, customer.id));

    return c.json({ customer, subscriptions: customerSubscriptions });
});

app.route("/projects", projectsRoute);
app.route("/projects", plansRoute);
app.route("/projects", customersRoute);
app.route("/projects", checkoutRoute);
app.route("/projects", apiKeysRoute);
app.route("/webhooks", stripeWebhookRoute);
app.route("/webhooks", paystackWebhookRoute);
app.route("/v1", v1Route);

export default {
    port: 4000,
    fetch: app.fetch,
};
