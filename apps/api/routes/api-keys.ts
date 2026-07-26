import { Hono } from "hono";
import { db, apiKeys } from "@pocketstrip/db";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import { randomBytes, createHash } from "crypto";
import { eq } from "drizzle-orm";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

function generateApiKey() {
    const secret = randomBytes(24).toString("hex");
    const fullKey = `psk_live_${secret}`;
    const keyPrefix = fullKey.slice(0, 12);
    const keyHash = createHash("sha256").update(fullKey).digest("hex");
    return { fullKey, keyPrefix, keyHash };
}

app.post("/:projectId/api-keys", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();

    if (!body.name || typeof body.name !== "string") {
        return c.json({ error: "name is required" }, 400);
    }

    const { fullKey, keyPrefix, keyHash } = generateApiKey();

    const [apiKey] = await db
        .insert(apiKeys)
        .values({ projectId, name: body.name, keyPrefix, keyHash })
        .returning();

    if (!apiKey) {
        return c.json({ error: "Failed to create API key" }, 500);
    }

    return c.json(
        {
            apiKey: {
                id: apiKey.id,
                name: apiKey.name,
                keyPrefix: apiKey.keyPrefix,
                createdAt: apiKey.createdAt,
            },
            key: fullKey,
        },
        201,
    );
});

app.get("/:projectId/api-keys", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");

    const keys = await db
        .select({
            id: apiKeys.id,
            name: apiKeys.name,
            keyPrefix: apiKeys.keyPrefix,
            lastUsedAt: apiKeys.lastUsedAt,
            createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.projectId, projectId));

    return c.json({ apiKeys: keys });
});

export default app;
