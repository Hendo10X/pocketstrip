import Stripe from "stripe";
import type {
    PaymentProvider,
    CreateCheckoutInput,
    CheckoutResult,
    VerifiedWebhookEvent,
} from "../provider";

export class UnhandledStripeEventError extends Error {
    constructor(public stripeEventType: string) {
        super(`Unhandled Stripe event type: ${stripeEventType}`);
    }
}

export class StripeProvider implements PaymentProvider {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(secretKey: string, webhookSecret: string) {
        this.stripe = new Stripe(secretKey);
        this.webhookSecret = webhookSecret;
    }

    async createCustomer(input: any): Promise<any> {
        const params: Stripe.CustomerCreateParams = {
            ...(input?.email ? { email: input.email } : {}),
            ...(input?.name ? { name: input.name } : {}),
            ...(input?.phone ? { phone: input.phone } : {}),
            ...(input?.metadata ? { metadata: input.metadata } : {}),
        };

        return this.stripe.customers.create(params);
    }

    async updateCustomer(customerId: string, input: any): Promise<any> {
        const params: Stripe.CustomerUpdateParams = {
            ...(input?.email ? { email: input.email } : {}),
            ...(input?.name ? { name: input.name } : {}),
            ...(input?.phone ? { phone: input.phone } : {}),
            ...(input?.metadata ? { metadata: input.metadata } : {}),
        };

        return this.stripe.customers.update(customerId, params);
    }

    async deleteCustomer(customerId: string): Promise<void> {
        await this.stripe.customers.del(customerId);
    }

    async createSubscription(input: any): Promise<any> {
        const params: Stripe.SubscriptionCreateParams = {
            customer: input?.customerId ?? input?.customer,
            items: input?.items ?? [{ price: input?.priceId }],
            ...(input?.trialPeriodDays !== undefined
                ? { trial_period_days: input.trialPeriodDays }
                : {}),
            ...(input?.metadata ? { metadata: input.metadata } : {}),
            ...(input?.defaultPaymentMethod
                ? { default_payment_method: input.defaultPaymentMethod }
                : {}),
            ...(input?.paymentBehavior
                ? { payment_behavior: input.paymentBehavior }
                : {}),
            ...(input?.collectionMethod
                ? { collection_method: input.collectionMethod }
                : {}),
        };

        return this.stripe.subscriptions.create(params);
    }

    async pauseSubscription(providerSubscriptionId: string): Promise<void> {
        await this.stripe.subscriptions.update(providerSubscriptionId, {
            pause_collection: { behavior: "void" },
        });
    }

    async resumeSubscription(providerSubscriptionId: string): Promise<void> {
        await this.stripe.subscriptions.update(providerSubscriptionId, {
            pause_collection: null as any,
        });
    }

    async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
        const session = await this.stripe.checkout.sessions.create({
            mode: "subscription",
            customer_email: input.customerEmail,
            line_items: [
                {
                    price_data: {
                        currency: input.currency,
                        product_data: { name: input.planName },
                        unit_amount: input.priceInMinorUnits,
                        recurring: { interval: input.billingInterval },
                    },
                    quantity: 1,
                },
            ],
            subscription_data: {
                ...(input.trialDays > 0
                    ? { trial_period_days: input.trialDays }
                    : {}),
                metadata: input.metadata,
            },
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            metadata: input.metadata,
        });

        if (!session.url) {
            throw new Error("Stripe did not return a checkout URL");
        }

        return {
            checkoutUrl: session.url,
            providerSessionId: session.id,
        };
    }

    async verifyWebhook(
        payload: string,
        signature: string,
    ): Promise<VerifiedWebhookEvent> {
        const event = await this.stripe.webhooks.constructEventAsync(
            payload,
            signature,
            this.webhookSecret,
        );

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                return {
                    type: "checkout.completed",
                    providerSubscriptionId: session.subscription as string,
                    providerCustomerId: session.customer as string,
                    metadata: session.metadata ?? {},
                    raw: event,
                };
            }

            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId =
                    invoice.parent?.type === "subscription_details"
                        ? invoice.parent.subscription_details?.subscription
                        : null;

                // Not every invoice belongs to a subscription (e.g. one-off charges).
                // We only care about subscription invoices, so quietly skip the rest.
                if (!subscriptionId) {
                    throw new UnhandledStripeEventError(
                        "invoice.paid (not subscription-related)",
                    );
                }

                return {
                    type: "subscription.renewed",
                    providerSubscriptionId: subscriptionId as string,
                    providerCustomerId: invoice.customer as string,
                    metadata: invoice.metadata ?? {},
                    raw: event,
                };
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                return {
                    type: "subscription.cancelled",
                    providerSubscriptionId: sub.id,
                    providerCustomerId: sub.customer as string,
                    metadata: sub.metadata ?? {},
                    raw: event,
                };
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId =
                    invoice.parent?.type === "subscription_details"
                        ? invoice.parent.subscription_details?.subscription
                        : null;

                if (!subscriptionId) {
                    throw new UnhandledStripeEventError(
                        "invoice.payment_failed (not subscription-related)",
                    );
                }

                return {
                    type: "payment.failed",
                    providerSubscriptionId: subscriptionId as string,
                    providerCustomerId: invoice.customer as string,
                    metadata: invoice.metadata ?? {},
                    raw: event,
                };
            }

            default:
                throw new UnhandledStripeEventError(event.type);
        }
    }

    async cancelSubscription(providerSubscriptionId: string): Promise<void> {
        await this.stripe.subscriptions.cancel(providerSubscriptionId);
    }
}
