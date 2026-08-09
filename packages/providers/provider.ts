// This file defines the interface for a payment provider, which can be implemented by different payment service providers (e.g., Stripe, PayPal, etc.). 
// It includes methods for creating a checkout session, verifying webhook events, and canceling subscriptions. 
// The interfaces also define the structure of the input and output data for these methods.

export interface PaymentProvider {
    // customer management.
    createCustomer(input: any): Promise<any>; // 'any' placeholder used temporarily, swap to concrete type.
    updateCustomer(customerId: string, input: any): Promise<any>;
    deleteCustomer(customerId: string): Promise<void>;

    // billing management.
    createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
    createSubscription(input: any): Promise<any>; 
    cancelSubscription(providerSubscriptionId: string): Promise<void>;
    pauseSubscription(providerSubscriptionId: string): Promise<void>;
    resumeSubscription(providerSubscriptionId: string): Promise<void>;

    verifyWebhook(
        payload: string,
        signature: string,
    ): Promise<VerifiedWebhookEvent>;
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

