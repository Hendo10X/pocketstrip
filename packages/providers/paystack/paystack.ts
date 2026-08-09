import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import type {
    PaymentProvider,
    CreateCheckoutInput,
    CheckoutResult,
    VerifiedWebhookEvent,
} from "../provider";
import type { paystackCreateCheckoutResponse } from "./types";

// base class for paystack provider errors, extended for specific error types.
export class PaystackProviderError extends Error {
    constructor(message: string, public readonly statusCode?: number) {
        super(message);
    }
}

// unhandled paystack event error, thrown when an event type is not recognized or handled by the provider.
export class UnhandledPaystackEventError extends PaystackProviderError {
    constructor(public paystackEventType: string) {
        super(`Unhandled Paystack event type: ${paystackEventType}`);
    }
}

export class PayStackProvider implements PaymentProvider {
    private readonly paystackBaseEndpoint: string;
    private readonly paystackSecretKey: string;

    constructor(secretKey?: string, baseUrl?: string) {
        this.paystackBaseEndpoint = baseUrl ?? process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";
        this.paystackSecretKey = secretKey ?? process.env.PAYSTACK_SECRET ?? "";
    }

    // utility methods.
    private ensureConfigured(): void {
        if (!this.paystackSecretKey) {
            throw new PaystackProviderError("PAYSTACK_SECRET is not configured");
        }
    }

    private getRequestHeaders(): Record<string, string> {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.paystackSecretKey}`,
        };
    }

    private normalizeMetadata(value: unknown): Record<string, string> {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
                key,
                String(entryValue),
            ]),
        );
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        // ensure the paystack secret key is configured, throw paystack error if not.
        this.ensureConfigured();

        const response = await fetch(`${this.paystackBaseEndpoint}${path}`, {
            ...init,
            headers: {
                ...this.getRequestHeaders(),
                ...(init.headers ?? {}),
            },
        });

        let body: unknown = null;
        try {
            body = await response.json();
        } catch {
            body = null;
        }

        if (!response.ok) {
            const message =
                typeof body === "object" && body && "message" in body
                    ? String((body as { message?: string }).message)
                    : "Paystack request failed";

            throw new PaystackProviderError(message, response.status);
        }

        return body as T;
    }

    async createCustomer(input: any): Promise<any> {
        return this.request<any>("/customer", {
            method: "POST",
            body: JSON.stringify({
                email: input?.email,
                first_name: input?.firstName ?? input?.first_name,
                last_name: input?.lastName ?? input?.last_name,
                phone: input?.phone,
                metadata: this.normalizeMetadata(input?.metadata),
            }),
        });
    }

    async updateCustomer(customerId: string, input: any): Promise<any> {
        return this.request<any>(`/customer/${encodeURIComponent(customerId)}`, {
            method: "PUT",
            body: JSON.stringify({
                first_name: input?.firstName ?? input?.first_name,
                last_name: input?.lastName ?? input?.last_name,
                phone: input?.phone,
                metadata: this.normalizeMetadata(input?.metadata),
            }),
        });
    }

    async deleteCustomer(customerId: string): Promise<void> {
        await this.request(`/customer/${encodeURIComponent(customerId)}`, {
            method: "DELETE",
        });
    }

    async createSubscription(input: any): Promise<any> {
        return this.request<any>("/subscription", {
            method: "POST",
            body: JSON.stringify({
                customer: input?.customer ?? input?.customerId,
                plan: input?.plan ?? input?.planCode,
                authorization: input?.authorization ?? input?.authorizationCode,
                start_date: input?.startDate,
                amount: input?.amount,
                invoice_limit: input?.invoiceLimit,
                metadata: this.normalizeMetadata(input?.metadata),
            }),
        });
    }

    async cancelSubscription(providerSubscriptionId: string): Promise<void> {
        await this.request(`/subscription/disable`, {
            method: "POST",
            body: JSON.stringify({ code: providerSubscriptionId }),
        });
    }

    async pauseSubscription(providerSubscriptionId: string): Promise<void> {
        await this.request(`/subscription/disable`, {
            method: "POST",
            body: JSON.stringify({ code: providerSubscriptionId }),
        });
    }

    async resumeSubscription(providerSubscriptionId: string): Promise<void> {
        await this.request(`/subscription/enable`, {
            method: "POST",
            body: JSON.stringify({ code: providerSubscriptionId }),
        });
    }

    async verifyWebhook(payload: string, signature: string): Promise<VerifiedWebhookEvent> {
        this.ensureConfigured();

        const expectedSignature = createHmac("sha512", this.paystackSecretKey)
            .update(payload)
            .digest("hex");

        const providedSignature = signature.trim();
        const expectedBuffer = Buffer.from(expectedSignature);
        const providedBuffer = Buffer.from(providedSignature);

        if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
            throw new PaystackProviderError("Invalid Paystack webhook signature");
        }

        const event = JSON.parse(payload) as {
            event?: string;
            data?: {
                customer?: { customer_code?: string; email?: string } | string;
                subscription?: { subscription_code?: string; plan?: string } | string;
                metadata?: Record<string, unknown>;
                status?: string;
                reference?: string;
            };
        };

        const eventData = event.data ?? {};
        const customerId =
            typeof eventData.customer === "object" && eventData.customer
                ? eventData.customer.customer_code ?? ""
                : typeof eventData.customer === "string"
                  ? eventData.customer
                  : "";

        const subscriptionId =
            typeof eventData.subscription === "object" && eventData.subscription
                ? eventData.subscription.subscription_code ?? ""
                : typeof eventData.subscription === "string"
                  ? eventData.subscription
                  : "";

        // Paystack has no top-level event id; use the transaction reference,
        // falling back to a hash of the payload so identical redeliveries
        // dedupe consistently in the webhook_events ledger.
        const providerEventId =
            eventData.reference ??
            createHash("sha256").update(payload).digest("hex");

        switch (event.event) {
            case "charge.success":
                return {
                    type: "checkout.completed",
                    providerEventId,
                    providerSubscriptionId: subscriptionId,
                    providerCustomerId: customerId,
                    metadata: this.normalizeMetadata(eventData.metadata),
                    raw: event,
                };
            case "subscription.disable":
                return {
                    type: "subscription.cancelled",
                    providerEventId,
                    providerSubscriptionId: subscriptionId,
                    providerCustomerId: customerId,
                    metadata: this.normalizeMetadata(eventData.metadata),
                    raw: event,
                };
            case "invoice.payment_failed":
                return {
                    type: "payment.failed",
                    providerEventId,
                    providerSubscriptionId: subscriptionId,
                    providerCustomerId: customerId,
                    metadata: this.normalizeMetadata(eventData.metadata),
                    raw: event,
                };
            case "subscription.create":
            case "subscription.not_renewed":
                return {
                    type: "subscription.renewed",
                    providerEventId,
                    providerSubscriptionId: subscriptionId,
                    providerCustomerId: customerId,
                    metadata: this.normalizeMetadata(eventData.metadata),
                    raw: event,
                };
            default:
                throw new UnhandledPaystackEventError(event.event ?? "unknown");
        }
    }

    async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
        this.ensureConfigured();

        const payload = {
            email: input.customerEmail,
            amount: Math.max(0, Math.round(input.priceInMinorUnits)),
            currency: input.currency.toUpperCase(),
            metadata: {
                ...this.normalizeMetadata(input.metadata),
                planName: input.planName,
                billingInterval: input.billingInterval,
                trialDays: String(input.trialDays),
                cancelUrl: input.cancelUrl,
            },
            callback_url: input.successUrl,
            reference: `pocketstrip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        };

        const paystackData = await this.request<paystackCreateCheckoutResponse>(
            "/transaction/initialize",
            {
                method: "POST",
                body: JSON.stringify(payload),
            },
        );

        return {
            checkoutUrl: paystackData.data.authorization_url,
            providerSessionId: paystackData.data.reference,
        };
    }
}
