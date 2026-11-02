import { db, projectProviders } from "@pocketstrip/db";
import { eq } from "drizzle-orm";
import { StripeProvider } from "../../../packages/providers/stripe";
import { PayStackProvider } from "../../../packages/providers/paystack";
import { decryptSecret } from "../../../packages/providers/crypto";
import {
    UnhandledStripeEventError,
    UnhandledPaystackEventError,
} from "@pocketstrip/providers";

export async function getProviderForProject(projectId: string) {
    // choose the project's default provider (or first) and construct adapter
    const row = await db.query.projectProviders.findFirst({
        where: eq(projectProviders.projectId, projectId),
    });

    if (!row) {
        throw new Error("No payment provider configured for project");
    }

    const secret = row.secretKeyEnc ? decryptSecret(row.secretKeyEnc) : "";

    switch (row.provider) {
        case "stripe":
            return new StripeProvider(secret, row.webhookSecret ?? "");
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
                const prov = new StripeProvider(secret, row.webhookSecret ?? "");
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
