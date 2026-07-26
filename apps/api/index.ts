import { Hono } from "hono";
import { cors } from "hono/cors";
import projectsRoute from "./routes/projects";
import plansRoute from "./routes/plans";
import customersRoute from "./routes/customers";
import checkoutRoute from "./routes/checkout";
import webhooksRoute from "./routes/webhooks";
import apiKeysRoute from "./routes/api-keys";
import { requireApiKey } from "./middleware/apiKey";
import type { Variables } from "./types";
import v1Route from "./routes/v1";

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
