import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    boolean,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    webhookSecret: text("webhook_secret").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const members = pgTable("members", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("owner"), // owner | admin | viewer
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plans = pgTable(
    "plans",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        price: integer("price").notNull(), // stored in minor units (cents/kobo)
        currency: text("currency").notNull().default("usd"),
        billingInterval: text("billing_interval").notNull(), // "month" | "year"
        trialDays: integer("trial_days").notNull().default(0),
        isPublic: boolean("is_public").notNull().default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        projectSlugUnique: uniqueIndex("plans_project_slug_unique").on(
            table.projectId,
            table.slug,
        ),
    }),
);

export const customers = pgTable(
    "customers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        email: text("email").notNull(),
        name: text("name"),
        providerCustomerId: text("provider_customer_id"),
        metadata: text("metadata"), // JSON string for now
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        projectEmailUnique: uniqueIndex("customers_project_email_unique").on(
            table.projectId,
            table.email,
        ),
    }),
);
export const subscriptions = pgTable(
    "subscriptions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        customerId: uuid("customer_id")
            .notNull()
            .references(() => customers.id, { onDelete: "restrict" }),
        planId: uuid("plan_id")
            .notNull()
            .references(() => plans.id, { onDelete: "restrict" }),
        status: text("status").notNull().default("trialing"),
        providerSubscriptionId: text("provider_subscription_id"),
        trialEnd: timestamp("trial_end"),
        currentPeriodStart: timestamp("current_period_start")
            .notNull()
            .defaultNow(),
        currentPeriodEnd: timestamp("current_period_end").notNull(),
        cancelAt: timestamp("cancel_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        projectStatusIdx: index("subscriptions_project_status_idx").on(
            table.projectId,
            table.status,
        ),
    }),
);

export const apiKeys = pgTable("api_keys", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const portalSessions = pgTable("portal_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectProviders = pgTable(
    "project_providers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        provider: text("provider").notNull(),
        publicKey: text("public_key"),
        secretKeyEnc: text("secret_key_enc").notNull(),
        webhookSecret: text("webhook_secret"),
        isDefault: boolean("is_default").notNull().default(false),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        projectProviderUnique: uniqueIndex("project_provider_unique").on(
            table.projectId,
            table.provider,
        ),
    }),
);
