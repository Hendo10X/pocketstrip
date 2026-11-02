import { db, portalSessions } from "@pocketstrip/db";
import { randomBytes, createHash } from "crypto";

const PORTAL_LINK_TTL_MS = 15 * 60 * 1000;

// Creates a single-use, 15-minute customer portal link. Only the token's hash
// is stored, so a database leak can't be used to open anyone's portal.
export async function createPortalLink(customerId: string) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + PORTAL_LINK_TTL_MS);

    await db.insert(portalSessions).values({ customerId, tokenHash, expiresAt });

    return {
        portalUrl: `${process.env.DASHBOARD_URL ?? "http://localhost:3000"}/portal/${rawToken}`,
        expiresAt,
    };
}
