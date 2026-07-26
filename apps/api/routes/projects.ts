import { Hono } from "hono";
import { db, projects, members } from "@pocketstrip/db";
import { requireAuth } from "../middleware/auth";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import type { Variables } from "../types";

const app = new Hono<{ Variables: Variables }>();

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
}

app.post("/", requireAuth, async (c) => {
    // TypeScript now knows exactly what `user` is!
    const user = c.get("user");
    const body = await c.req.json();

    if (!body.name || typeof body.name !== "string") {
        return c.json({ error: "name is required" }, 400);
    }

    const baseSlug = slugify(body.name);
    const slug = `${baseSlug}-${randomBytes(3).toString("hex")}`;
    const webhookSecret = `whsec_${randomBytes(24).toString("hex")}`;

    const [project] = await db
        .insert(projects)
        .values({
            ownerId: user.id,
            name: body.name,
            slug,
            webhookSecret,
        })
        .returning();

    // 2. Protect against the undefined edge case
    if (!project) {
        return c.json({ error: "Failed to create project" }, 500);
    }

    await db.insert(members).values({
        projectId: project.id,
        userId: user.id,
        role: "owner",
    });

    return c.json({ project }, 201);
});

app.get("/", requireAuth, async (c) => {
    const user = c.get("user");

    const userProjects = await db
        .select({ project: projects, role: members.role })
        .from(members)
        .innerJoin(projects, eq(members.projectId, projects.id))
        .where(eq(members.userId, user.id));

    return c.json({ projects: userProjects });
});

export default app;
