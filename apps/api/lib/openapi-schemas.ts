import { z } from "zod";

// Common error responses
export const ErrorSchema = z.object({
    error: z.string(),
});

export const NotFoundSchema = z.object({
    error: z.literal("Not found"),
});

export const UnauthorizedSchema = z.object({
    error: z.literal("Unauthorized"),
});

// Health check
export const HealthSchema = z.object({
    status: z.enum(["ok", "error"]),
});

// API Key validation
export const ApiKeyTestSchema = z.object({
    message: z.string(),
    project: z.object({
        id: z.string(),
        name: z.string(),
    }),
});

// Portal
export const PlanSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    currency: z.string(),
    billingInterval: z.enum(["monthly", "yearly"]),
});

export const SubscriptionSchema = z.object({
    id: z.string(),
    status: z.enum(["active", "canceled", "past_due"]),
    currentPeriodEnd: z.string().datetime(),
    cancelAt: z.string().datetime().nullable(),
    planName: z.string(),
    price: z.number(),
    currency: z.string(),
    billingInterval: z.enum(["monthly", "yearly"]),
});

export const CustomerSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().email(),
    stripeId: z.string().nullable(),
    created: z.string().datetime(),
});

export const PortalSessionSchema = z.object({
    customer: CustomerSchema,
    subscriptions: z.array(SubscriptionSchema),
});

// Common parameters
export const ApiKeyParamSchema = z.object({
    "x-api-key": z.string(),
});

export const ProjectIdParamSchema = z.object({
    projectId: z.string(),
});
