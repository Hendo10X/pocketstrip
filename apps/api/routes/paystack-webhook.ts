import { Hono } from "hono";
import { verifyWebhookForProvider } from "../lib/provider";
import { UnhandledPaystackEventError } from "@pocketstrip/providers";
import { handleVerifiedEvent } from "./webhook-handler";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

app.post("/paystack", async (c) => {
    const signature = c.req.header("x-paystack-signature");

    if (!signature) {
        return c.json({ error: "Missing x-paystack-signature header" }, 400);
    }

    const rawBody = await c.req.text();

    let event;
    try {
        event = await verifyWebhookForProvider("paystack", rawBody, signature);
    } catch (err) {
        if (err instanceof UnhandledPaystackEventError) {
            return c.json({ received: true, ignored: true });
        }
        console.error("Paystack webhook signature verification failed:", err);
        return c.json({ error: "Invalid signature" }, 400);
    }

    const result = await handleVerifiedEvent("paystack", event);
    return c.json(result);
});

export default app;
