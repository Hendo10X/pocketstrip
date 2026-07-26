import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@pocketstrip/db";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [process.env.DASHBOARD_URL ?? "http://localhost:3000"],
});
