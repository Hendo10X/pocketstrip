import type { MiddlewareHandler } from "hono";
import { db, members } from "@pocketstrip/db";
import { and, eq } from "drizzle-orm";

export const requireMembership: MiddlewareHandler = async (c, next) => {
    const user = c.get("user");
    const projectId = c.req.param("projectId");

    // Guard check: ensure projectId param exists and user is authenticated
    if (!projectId || !user) {
        return c.json(
            { error: "Project ID and authenticated user are required" },
            400,
        );
    }

    // TypeScript now knows `projectId` is 100% a string!
    const membership = await db.query.members.findFirst({
        where: and(
            eq(members.projectId, projectId),
            eq(members.userId, user.id),
        ),
    });

    if (!membership) {
        return c.json(
            { error: "Forbidden: You are not a member of this project" },
            403,
        );
    }

    c.set("membership", membership);
    await next();
};
