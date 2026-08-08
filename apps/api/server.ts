import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
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

// PocketStripServer class encapsulates the PocketStrip API server setup and configuration.
// This class provides methods to set up Swagger documentation, configure CORS, register routes, and retrieve the Hono application instance.
// PocketStripServer is designed to be modular and extensible, allowing for easy integration of additional routes and middleware as needed.
// PocketStripServer is instantiated ONCE and used to configure the PocketStrip API server in 'index.ts' [application root] keeping 'index.ts' thin, flexible and testable.
export class PocketStripServer {
    private app: OpenAPIHono<{ Variables: Variables }>;

    constructor() {
        this.app = new OpenAPIHono<{ Variables: Variables }>();
    }

    // setup swagger documentation for PocketStripAPI.
    public setupSwaggerDocs() {
        this.app.doc("/openapi.json", {
            openapi: "3.0.0",
            info: {
                version: "1.0.0",
                title: "Pocketstrip API",
                description: "Abstracted Interface for bootstrapping payments for SAAS applications. [Provider Agnostic]",
                contact: {
                    name: "Hendo10x <===> Dom-HTG",
                },
            },
            servers: [
                {
                    url: process.env.API_URL ?? "http://localhost:4000",
                    description: "PocketStrip Service: contains the PocketStrip dashboard API and the SDK API for provider abstraction",
                },
            ],
        });

        // register the docs & redoc routes.
        this.app.get("/docs", swaggerUI({ url: "/openapi.json" }));
        this.app.get("/redoc", (c) =>{
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
    };

    // setup cors.
    public setupCorsConfig() {
        this.app.use(
            "*",
            cors({
                origin: process.env.DASHBOARD_URL ?? "http://localhost:3000",
                credentials: true,
            }),
        );
    };

    public setupRoutes() {
        const healthRoute = createRoute({
            method: "get",
            path: "/healthz",
            tags: ["Health"],
            summary: "Health check",
            description: "Returns the API health status",
            responses: {
                200: {
                    description: "Service is healthy",
                    content: {
                        "application/json": {
                            schema: z.object({
                                status: z.string(),
                            }),
                        },
                    },
                },
            },
        });

        this.app.openapi(healthRoute, (c) =>
            c.json({ status: "PocketStrip Service is healthy!" }),
        );

        const testApiKeyRoute = createRoute({
            method: "get",
            path: "/test-api-key",
            tags: ["Authentication"],
            summary: "Validate API key",
            description: "Validates the supplied API key and returns the owning project",
            responses: {
                200: {
                    description: "API key is valid",
                    content: {
                        "application/json": {
                            schema: z.object({
                                message: z.string(),
                                project: z.object({
                                    name: z.string(),
                                }),
                            }),
                        },
                    },
                },
                401: { description: "Unauthorized" },
            },
        });

        this.app.use("/test-api-key", requireApiKey);

        this.app.openapi(testApiKeyRoute, async (c) => {
            const project = c.get("project");
            return c.json({
                message: "API key is valid!",
                project: { name: project.name },
            });
        });

        const portalRoute = createRoute({
            method: "get",
            path: "/portal/{token}",
            tags: ["Portal"],
            summary: "Access customer portal",
            description: "Validates a portal token and returns customer subscription information",
            request: {
                params: z.object({
                    token: z.string(),
                }),
            },
            responses: {
                200: {
                    description: "Portal data returned",
                    content: {
                        "application/json": {
                            schema: z.object({
                                customer: z.unknown(),
                                subscriptions: z.unknown(),
                            }),
                        },
                    },
                },
                401: { description: "Portal token invalid or expired" },
                404: { description: "Customer not found" },
            },
        });

        this.app.openapi(portalRoute, async (c) => {
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

        // PocketStrip health status
        this.app.get("/healthz", (c) => c.json({ status: "PocketStrip Service is healthy!" }));

        // validate API key
        this.app.get("/test-api-key", requireApiKey, (c) => {
            const project = c.get("project");
            return c.json({
                message: "API key is valid!",
                project: project.name,
            });
        });

        // portal
        this.app.get("/portal/:token", async (c) => {
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
            };

            const customer = await db.query.customers.findFirst({
                where: eq(customers.id, session.customerId),
            });

            if (!customer) {
                return c.json({ error: "Customer not found" }, 404);
            };

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
    };

    public registerRoutes() {
        this.app.route("/projects", projectsRoute);
        this.app.route("/projects", plansRoute);
        this.app.route("/projects", customersRoute);
        this.app.route("/projects", checkoutRoute);
        this.app.route("/projects", apiKeysRoute);
        this.app.route("/webhooks", stripeWebhookRoute);
        this.app.route("/webhooks", paystackWebhookRoute);
        this.app.route("/v1", v1Route);
    };

    public getApp() {
        return this.app;
    };
};
