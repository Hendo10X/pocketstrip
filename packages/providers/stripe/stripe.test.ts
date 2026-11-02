import { describe, it, expect } from "bun:test";
import Stripe from "stripe";
import { StripeProvider, UnhandledStripeEventError } from "./stripe";

const WEBHOOK_SECRET = "whsec_test_secret";
const provider = new StripeProvider("sk_test_dummy", WEBHOOK_SECRET);
const stripe = new Stripe("sk_test_dummy");

async function signed(event: Record<string, unknown>) {
    const payload = JSON.stringify({ id: "evt_1", object: "event", ...event });
    const signature = await stripe.webhooks.generateTestHeaderStringAsync({
        payload,
        secret: WEBHOOK_SECRET,
    });
    return { payload, signature };
}

function invoiceEvent(billingReason: string) {
    return {
        type: "invoice.paid",
        data: {
            object: {
                object: "invoice",
                customer: "cus_1",
                billing_reason: billingReason,
                metadata: {},
                parent: {
                    type: "subscription_details",
                    subscription_details: { subscription: "sub_1" },
                },
            },
        },
    };
}

describe("StripeProvider.verifyWebhook", () => {
    it("maps checkout.session.completed with its event id and metadata", async () => {
        const { payload, signature } = await signed({
            type: "checkout.session.completed",
            data: {
                object: {
                    object: "checkout.session",
                    subscription: "sub_1",
                    customer: "cus_1",
                    metadata: { projectId: "p1", customerId: "c1", planId: "pl1" },
                },
            },
        });

        const event = await provider.verifyWebhook(payload, signature);
        expect(event.type).toBe("checkout.completed");
        expect(event.providerEventId).toBe("evt_1");
        expect(event.providerSubscriptionId).toBe("sub_1");
        expect(event.metadata.planId).toBe("pl1");
    });

    it("treats a cycle invoice as a renewal", async () => {
        const { payload, signature } = await signed(
            invoiceEvent("subscription_cycle"),
        );
        const event = await provider.verifyWebhook(payload, signature);
        expect(event.type).toBe("subscription.renewed");
        expect(event.providerSubscriptionId).toBe("sub_1");
    });

    it("ignores the first invoice of a new subscription", async () => {
        // checkout.session.completed already recorded it; renewing here would
        // push the period forward and duplicate the invoice.
        const { payload, signature } = await signed(
            invoiceEvent("subscription_create"),
        );
        await expect(
            provider.verifyWebhook(payload, signature),
        ).rejects.toBeInstanceOf(UnhandledStripeEventError);
    });

    it("rejects a bad signature", async () => {
        const { payload } = await signed(invoiceEvent("subscription_cycle"));
        await expect(
            provider.verifyWebhook(payload, "t=1,v1=deadbeef"),
        ).rejects.toThrow();
    });
});
