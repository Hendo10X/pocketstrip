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
    providerSubscriptionId: string;
    providerCustomerId: string;
    metadata: Record<string, string>;
    raw: unknown;
}

export interface PaymentProvider {
    createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
    verifyWebhook(
        payload: string,
        signature: string,
    ): Promise<VerifiedWebhookEvent>;
    cancelSubscription(providerSubscriptionId: string): Promise<void>;
}
