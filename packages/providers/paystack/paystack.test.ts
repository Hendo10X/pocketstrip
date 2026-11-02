import { describe, it, expect } from "bun:test";
import { createHmac } from "node:crypto";
import {
    PayStackProvider,
    PaystackProviderError,
    UnhandledPaystackEventError,
} from "./paystack";

const SECRET = "sk_test_paystack_secret";
const provider = new PayStackProvider(SECRET, "http://paystack.invalid");

function signed(body: unknown) {
    const payload = JSON.stringify(body);
    const signature = createHmac("sha512", SECRET).update(payload).digest("hex");
    return { payload, signature };
}

describe("PayStackProvider.verifyWebhook", () => {
    it("maps charge.success to checkout.completed, keyed on the reference", async () => {
        const { payload, signature } = signed({
            event: "charge.success",
            data: {
                reference: "pocketstrip_ref_1",
                customer: { customer_code: "CUS_1" },
                metadata: { projectId: "p1", customerId: "c1", planId: "pl1" },
            },
        });

        const event = await provider.verifyWebhook(payload, signature);

        expect(event.type).toBe("checkout.completed");
        expect(event.providerEventId).toBe("pocketstrip_ref_1");
        // No subscription code on a one-time charge: fall back to the reference
        // so the row is never keyed on an empty string.
        expect(event.providerSubscriptionId).toBe("pocketstrip_ref_1");
        expect(event.metadata.planId).toBe("pl1");
    });

    it("maps a recurring invoice to subscription.renewed", async () => {
        const { payload, signature } = signed({
            event: "invoice.update",
            data: {
                subscription: { subscription_code: "SUB_1" },
                customer: { customer_code: "CUS_1" },
            },
        });

        const event = await provider.verifyWebhook(payload, signature);
        expect(event.type).toBe("subscription.renewed");
        expect(event.providerSubscriptionId).toBe("SUB_1");
    });

    it("rejects a bad signature", async () => {
        const { payload } = signed({ event: "charge.success", data: {} });
        await expect(
            provider.verifyWebhook(payload, "0".repeat(128)),
        ).rejects.toBeInstanceOf(PaystackProviderError);
    });

    it("ignores subscription.create to avoid a double insert", async () => {
        const { payload, signature } = signed({
            event: "subscription.create",
            data: {},
        });
        await expect(
            provider.verifyWebhook(payload, signature),
        ).rejects.toBeInstanceOf(UnhandledPaystackEventError);
    });
});
