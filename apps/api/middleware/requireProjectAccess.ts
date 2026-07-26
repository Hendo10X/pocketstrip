import type { MiddlewareHandler } from "hono";
import type { Variables } from "../types";
import { db, members, projects, apiKeys } from "@pocketstrip/db";
import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { auth } from "@pocketstrip/auth";

export const requireProjectAccess: MiddlewareHandler<{
    Variables: Variables;
}> = async (c, next) => {
    const projectId = c.req.param("projectId");

    if (!projectId) {
        return c.json({ error: "projectId is required" }, 400);
    }

    const authHeader = c.req.header("authorization");

    // Path 1: API key (external caller, e.g. the SDK)
    if (authHeader?.startsWith("Bearer ")) {
        const providedKey = authHeader.replace("Bearer ", "").trim();
        const keyPrefix = providedKey.slice(0, 12);

        const candidate = await db.query.apiKeys.findFirst({
            where: eq(apiKeys.keyPrefix, keyPrefix),
        });

        if (!candidate) return c.json({ error: "Invalid API key" }, 401);

        const providedHash = createHash("sha256")
            .update(providedKey)
            .digest("hex");
        if (providedHash !== candidate.keyHash)
            return c.json({ error: "Invalid API key" }, 401);

        if (candidate.projectId !== projectId) {
            return c.json(
                { error: "This key does not belong to this project" },
                403,
            );
        }

        await db
            .update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, candidate.id));

        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });
        if (!project) return c.json({ error: "Project not found" }, 404);

        c.set("project", project);
        await next();
        return;
    }

    // Path 2: dashboard session cookie
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const membership = await db.query.members.findFirst({
        where: and(
            eq(members.projectId, projectId),
            eq(members.userId, session.user.id),
        ),
    });
    if (!membership) return c.json({ error: "Forbidden" }, 403);

    c.set("user", session.user);
    c.set("session", session.session);
    c.set("membership", membership);
    await next();
};
