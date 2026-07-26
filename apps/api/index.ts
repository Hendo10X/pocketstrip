import { Hono } from "hono";
import { cors } from "hono/cors";
import { db, portalSessions, customers } from "@pocketstrip/db";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createHash } from "crypto";
import projectsRoute from "./routes/projects";
import plansRoute from "./routes/plans";
import customersRoute from "./routes/customers";
import checkoutRoute from "./routes/checkout";
import webhooksRoute from "./routes/webhooks";
import apiKeysRoute from "./routes/api-keys";
import v1Route from "./routes/v1";
import { requireApiKey } from "./middleware/apiKey";
import type { Variables } from "./types";

const app = new Hono<{ Variables: Variables }>();

app.use(
    "*",
    cors({
        origin: process.env.DASHBOARD_URL ?? "http://localhost:3000",
        credentials: true,
    }),
);

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

    return c.json({ customer });
});

app.route("/projects", projectsRoute);
app.route("/projects", plansRoute);
app.route("/projects", customersRoute);
app.route("/projects", checkoutRoute);
app.route("/projects", apiKeysRoute);
app.route("/webhooks", webhooksRoute);
app.route("/v1", v1Route);

export default {
    port: 4000,
    fetch: app.fetch,
};
