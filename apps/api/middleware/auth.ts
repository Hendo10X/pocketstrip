import type { MiddlewareHandler } from "hono";
import { auth } from "@pocketstrip/auth";

export const requireAuth: MiddlewareHandler = async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    c.set("session", session.session);
    await next();
};
