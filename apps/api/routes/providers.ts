import { Hono } from "hono";
import { db, projectProviders } from "@pocketstrip/db";
import { and, eq, ne } from "drizzle-orm";
import { encryptSecret, decryptSecret } from "@pocketstrip/providers";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import {
    buildProvider,
    SUPPORTED_PROVIDERS,
    type SupportedProvider,
} from "../lib/provider";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

const API_URL = () => process.env.API_URL ?? "http://localhost:4000";

// Expected key shapes, so obvious paste mistakes fail before a network call.
const SECRET_KEY_PATTERN: Record<SupportedProvider, RegExp> = {
    stripe: /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/,
    paystack: /^sk_(test|live)_[A-Za-z0-9]+$/,
};

function isSupported(value: string): value is SupportedProvider {
    return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

function maskKey(encrypted: string): string {
    try {
        const plain = decryptSecret(encrypted);
        const mode = plain.includes("_live_") ? "live" : "test";
        return `${plain.split("_")[0]}_${mode}_…${plain.slice(-4)}`;
    } catch {
        return "unreadable — reconnect";
    }
}

function canEdit(role: string) {
    return role === "owner" || role === "admin";
}

// List configured providers. Secrets are never returned — only a masked hint.
app.get("/:projectId/providers", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");

    const rows = await db.query.projectProviders.findMany({
        where: eq(projectProviders.projectId, projectId),
    });

    return c.json({
        providers: rows.map((row) => ({
            id: row.id,
            provider: row.provider,
            isDefault: row.isDefault,
            keyHint: maskKey(row.secretKeyEnc),
            hasWebhookSecret: !!row.webhookSecret,
            createdAt: row.createdAt,
        })),
        webhookUrls: Object.fromEntries(
            SUPPORTED_PROVIDERS.map((p) => [p, `${API_URL()}/webhooks/${p}`]),
        ),
    });
});

// Connect (or replace) a provider's credentials for this project.
app.put(
    "/:projectId/providers/:provider",
    requireAuth,
    requireMembership,
    async (c) => {
        const projectId = c.req.param("projectId");
        const provider = c.req.param("provider");
        const membership = c.get("membership");

        if (!canEdit(membership.role)) {
            return c.json(
                { error: "Only project owners and admins can manage providers" },
                403,
            );
        }
        if (!isSupported(provider)) {
            return c.json({ error: `Unsupported provider: ${provider}` }, 400);
        }

        const body = await c.req.json().catch(() => ({}));
        const secretKey =
            typeof body.secretKey === "string" ? body.secretKey.trim() : "";
        const webhookSecret =
            typeof body.webhookSecret === "string"
                ? body.webhookSecret.trim()
                : "";

        if (!SECRET_KEY_PATTERN[provider].test(secretKey)) {
            return c.json(
                {
                    error:
                        provider === "stripe"
                            ? "Enter a Stripe secret key (starts with sk_test_ or sk_live_)"
                            : "Enter a Paystack secret key (starts with sk_test_ or sk_live_)",
                },
                400,
            );
        }

        // Stripe signs webhooks with a separate secret; without it no
        // subscription would ever be recorded. Paystack signs with the API key.
        if (provider === "stripe" && !webhookSecret.startsWith("whsec_")) {
            return c.json(
                {
                    error: "Enter the Stripe webhook signing secret (starts with whsec_)",
                },
                400,
            );
        }

        try {
            await buildProvider(
                provider,
                secretKey,
                webhookSecret,
            ).verifyCredentials();
        } catch {
            return c.json(
                {
                    error: `${provider === "stripe" ? "Stripe" : "Paystack"} rejected this key. Check it and try again.`,
                },
                400,
            );
        }

        let secretKeyEnc: string;
        let webhookSecretEnc: string | null;
        try {
            secretKeyEnc = encryptSecret(secretKey);
            webhookSecretEnc = webhookSecret ? encryptSecret(webhookSecret) : null;
        } catch (err) {
            console.error("Provider secret encryption failed:", err);
            return c.json(
                {
                    error: "Server is missing a valid PROVIDERS_MASTER_KEY. See the README setup steps.",
                },
                500,
            );
        }

        const existing = await db.query.projectProviders.findMany({
            where: eq(projectProviders.projectId, projectId),
        });
        const others = existing.filter((row) => row.provider !== provider);
        // First provider becomes the default automatically.
        const isDefault = body.isDefault === true || others.length === 0;

        const [row] = await db
            .insert(projectProviders)
            .values({
                projectId,
                provider,
                secretKeyEnc,
                webhookSecret: webhookSecretEnc,
                isDefault,
            })
            .onConflictDoUpdate({
                target: [projectProviders.projectId, projectProviders.provider],
                set: {
                    secretKeyEnc,
                    webhookSecret: webhookSecretEnc,
                    isDefault,
                },
            })
            .returning();

        if (isDefault) {
            await db
                .update(projectProviders)
                .set({ isDefault: false })
                .where(
                    and(
                        eq(projectProviders.projectId, projectId),
                        ne(projectProviders.provider, provider),
                    ),
                );
        }

        return c.json({
            provider: {
                id: row?.id,
                provider,
                isDefault,
                keyHint: row ? maskKey(row.secretKeyEnc) : null,
                hasWebhookSecret: !!webhookSecretEnc,
            },
        });
    },
);

// Disconnect a provider.
app.delete(
    "/:projectId/providers/:provider",
    requireAuth,
    requireMembership,
    async (c) => {
        const projectId = c.req.param("projectId");
        const provider = c.req.param("provider");

        if (!canEdit(c.get("membership").role)) {
            return c.json(
                { error: "Only project owners and admins can manage providers" },
                403,
            );
        }

        const [removed] = await db
            .delete(projectProviders)
            .where(
                and(
                    eq(projectProviders.projectId, projectId),
                    eq(projectProviders.provider, provider),
                ),
            )
            .returning();

        if (!removed) return c.json({ error: "Provider not connected" }, 404);

        // Keep a default if any provider remains.
        if (removed.isDefault) {
            const next = await db.query.projectProviders.findFirst({
                where: eq(projectProviders.projectId, projectId),
            });
            if (next) {
                await db
                    .update(projectProviders)
                    .set({ isDefault: true })
                    .where(eq(projectProviders.id, next.id));
            }
        }

        return c.json({ removed: true });
    },
);

export default app;
