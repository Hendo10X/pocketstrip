import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    boolean,
    uniqueIndex,
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
