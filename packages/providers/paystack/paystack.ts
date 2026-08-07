import Paystack from "@paystack/paystack-sdk";
import type {
    PaymentProvider,
    CreateCheckoutInput,
    CheckoutResult,
    VerifiedWebhookEvent,
} from "../provider";

// base class for paystack provider errors, extended for specific error types.
export class PaystackProviderError extends Error {
    constructor(public code?: string, errObject?: any) {
        super(code, errObject);
    }
}

// unhandled paystack event error, thrown when an event type is not recognized or handled by the provider.
export class UnhandledPaystackEventError extends PaystackProviderError {
    constructor(public paystackEventType: string) {
        super(`Unhandled Paystack event type: ${paystackEventType}`);
    }
}

class PayStackProvider implements PaymentProvider {
    private paystack: Paystack;
    private paystackSecret: string;

    constructor(paystackSecret: string) {
        this.paystackSecret = process.env.PAYSTACK_SECRET as string;
        
        this.paystack = new Paystack(paystackSecret);
    }


}
