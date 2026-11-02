import { db, projectProviders } from "@pocketstrip/db";
import { eq } from "drizzle-orm";
import { StripeProvider } from "../../../packages/providers/stripe";
import { PayStackProvider } from "../../../packages/providers/paystack";
import { decryptSecret } from "../../../packages/providers/crypto";
import {
    UnhandledStripeEventError,
    UnhandledPaystackEventError,
} from "@pocketstrip/providers";

export const SUPPORTED_PROVIDERS = ["stripe", "paystack"] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

// Build an adapter from plaintext credentials (e.g. to verify keys before
// they are encrypted and saved).
export function buildProvider(
    provider: SupportedProvider,
    secretKey: string,
    webhookSecret = "",
) {
    return provider === "stripe"
        ? new StripeProvider(secretKey, webhookSecret)
        : new PayStackProvider(secretKey);
}

// Webhook signing secrets are stored encrypted, same as API keys.
function decryptWebhookSecret(row: { webhookSecret: string | null }): string {
    return row.webhookSecret ? decryptSecret(row.webhookSecret) : "";
}

export async function getProviderForProject(projectId: string) {
    // Choose the project's default provider, falling back to the first
    // configured one. A project can have several providers, so we must not
    // pick an arbitrary row — that could charge through the wrong provider.
    const rows = await db.query.projectProviders.findMany({
        where: eq(projectProviders.projectId, projectId),
    });

    const row = rows.find((r) => r.isDefault) ?? rows[0];

    if (!row) {
        throw new Error("No payment provider configured for project");
    }

    const secret = row.secretKeyEnc ? decryptSecret(row.secretKeyEnc) : "";

    switch (row.provider) {
        case "stripe":
            return new StripeProvider(secret, decryptWebhookSecret(row));
        case "paystack":
            // PayStackProvider constructor accepts (secretKey?, baseUrl?)
            return new PayStackProvider(secret);
        default:
            throw new Error(`Unsupported provider: ${row.provider}`);
    }
}

// Attempt to verify a webhook payload across all configured provider rows for a given provider type. 
export async function verifyWebhookForProvider(
    providerName: string,
    payload: string,
    signature: string,
) {
    const rows = await db.query.projectProviders.findMany({
        where: eq(projectProviders.provider, providerName),
    });

    for (const row of rows) {
        try {
            const secret = row.secretKeyEnc ? decryptSecret(row.secretKeyEnc) : "";
            if (providerName === "stripe") {
                const prov = new StripeProvider(secret, decryptWebhookSecret(row));
                const event = await prov.verifyWebhook(payload, signature);
                // attach projectId from config if missing in metadata
                if (!event.metadata.projectId) {
                    event.metadata = { ...event.metadata, projectId: row.projectId };
                }
                return event;
            }

            if (providerName === "paystack") {
                const prov = new PayStackProvider(secret);
                const event = await prov.verifyWebhook(payload, signature);
                if (!event.metadata.projectId) {
                    event.metadata = { ...event.metadata, projectId: row.projectId };
                }
                return event;
            }
        } catch (err) {
            // A verified-but-unhandled event type means the signature already
            // matched this config — surface it so the route can reply
            // {ignored:true} (a 200) instead of retrying forever. Only genuine
            // signature mismatches fall through to the next configured row.
            if (
                err instanceof UnhandledStripeEventError ||
                err instanceof UnhandledPaystackEventError
            ) {
                throw err;
            }
            continue;
        }
    }

    throw new Error("Webhook verification failed for any configured provider config");
}
