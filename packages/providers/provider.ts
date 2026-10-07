// The PaymentProvider contract that every provider adapter (Stripe, Paystack,
// …) implements. It is intentionally minimal — only the operations the app
// actually calls today — and grows per-feature with concrete types rather than
// `any`, so the compiler keeps adapters interchangeable and correct.

export interface PaymentProvider {
    createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
    cancelSubscription(
        providerSubscriptionId: string,
        options?: CancelOptions,
    ): Promise<void>;
    verifyWebhook(
        payload: string,
        signature: string,
    ): Promise<VerifiedWebhookEvent>;
}

export interface CancelOptions {
    // When true, cancel at the end of the current billing period rather than
    // immediately. Providers without native support cancel immediately.
    atPeriodEnd?: boolean;
}

export interface CreateCheckoutInput {
    customerEmail: string;
    planName: string;
    priceInMinorUnits: number;
    currency: string;
    billingInterval: "month" | "year";
    trialDays: number;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
}

export interface CheckoutResult {
    checkoutUrl: string;
    providerSessionId: string;
}

export interface VerifiedWebhookEvent {
    type:
        | "checkout.completed"
        | "subscription.renewed"
        | "subscription.cancelled"
        | "payment.failed";
    // Provider's unique event id, used for idempotent processing.
    providerEventId: string;
    providerSubscriptionId: string;
    providerCustomerId: string;
    metadata: Record<string, string>;
    raw: unknown;
}
