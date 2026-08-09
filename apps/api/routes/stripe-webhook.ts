import { Hono } from "hono";
import { verifyWebhookForProvider } from "../lib/provider";
import { UnhandledStripeEventError } from "@pocketstrip/providers";
import { handleVerifiedEvent } from "./webhook-handler";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

app.post("/stripe", async (c) => {
    const signature = c.req.header("stripe-signature");

    if (!signature) {
        return c.json({ error: "Missing stripe-signature header" }, 400);
    }

    const rawBody = await c.req.text();

    let event;
    try {
        event = await verifyWebhookForProvider("stripe", rawBody, signature);
    } catch (err) {
        if (err instanceof UnhandledStripeEventError) {
            return c.json({ received: true, ignored: true });
        }
        console.error("Webhook signature verification failed:", err);
        return c.json({ error: "Invalid signature" }, 400);
    }

    const result = await handleVerifiedEvent("stripe", event);
    return c.json(result);
});

export default app;
