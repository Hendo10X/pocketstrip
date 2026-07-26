import type { MiddlewareHandler } from "hono";
import { db, apiKeys, projects } from "@pocketstrip/db";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import type { Variables } from "../types";

export const requireApiKey: MiddlewareHandler<{
    Variables: Variables;
}> = async (c, next) => {
    const authHeader = c.req.header("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return c.json(
            { error: "Missing or invalid Authorization header" },
            401,
        );
    }

    const providedKey = authHeader.replace("Bearer ", "").trim();
    const keyPrefix = providedKey.slice(0, 12);

    const candidate = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.keyPrefix, keyPrefix),
    });

    if (!candidate) {
        return c.json({ error: "Invalid API key" }, 401);
    }

    const providedHash = createHash("sha256").update(providedKey).digest("hex");

    if (providedHash !== candidate.keyHash) {
        return c.json({ error: "Invalid API key" }, 401);
    }

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, candidate.projectId),
    });

    if (!project) {
        return c.json({ error: "Project not found" }, 401);
    }

    await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, candidate.id));

    c.set("project", project);
    await next();
};
