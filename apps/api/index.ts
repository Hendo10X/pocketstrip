import { Hono } from "hono";
import { cors } from "hono/cors";
import projectsRoute from "./routes/projects";
import plansRoute from "./routes/plan";
import customersRoute from "./routes/customers";
import subscriptionsRoute from "./routes/subscriptions";
import checkoutRoute from "./routes/checkout";
import webhooksRoute from "./routes/webhooks";

const app = new Hono();

app.use(
    "*",
    cors({
        origin: process.env.DASHBOARD_URL ?? "http://localhost:3000",
        credentials: true,
    }),
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/projects", projectsRoute);
app.route("/projects", plansRoute);
app.route("/projects", customersRoute);
app.route("/projects", subscriptionsRoute);
app.route("/projects", checkoutRoute);
app.route("/webhooks", webhooksRoute);
export default {
    port: 4000,
    fetch: app.fetch,
};
