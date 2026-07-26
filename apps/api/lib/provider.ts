import { StripeProvider } from "@pocketstrip/providers";

export const paymentProvider = new StripeProvider(
    process.env.STRIPE_SECRET_KEY!,
    process.env.STRIPE_WEBHOOK_SECRET!,
);
