import { Hono } from "hono";
import {
    db,
    projects,
    members,
    subscriptions,
    customers,
} from "@pocketstrip/db";
import { requireAuth } from "../middleware/auth";
import { requireMembership } from "../middleware/membership";
import { randomBytes } from "crypto";
import { eq, and, count } from "drizzle-orm";
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

app.get("/by-slug/:slug", requireAuth, async (c) => {
    const user = c.get("user");
    const slug = c.req.param("slug");

    const result = await db
        .select({ project: projects, role: members.role })
        .from(members)
        .innerJoin(projects, eq(members.projectId, projects.id))
        .where(and(eq(projects.slug, slug), eq(members.userId, user.id)));

    const row = result[0];
    if (!row) return c.json({ error: "Project not found" }, 404);

    return c.json({ project: row.project, role: row.role });
});

app.get("/:projectId/stats", requireAuth, requireMembership, async (c) => {
    const projectId = c.req.param("projectId");

    const activeCountResult = await db
        .select({ value: count() })
        .from(subscriptions)
        .where(
            and(
                eq(subscriptions.projectId, projectId),
                eq(subscriptions.status, "active"),
            ),
        );

    const customerCountResult = await db
        .select({ value: count() })
        .from(customers)
        .where(eq(customers.projectId, projectId));

    return c.json({
        activeSubscriptions: activeCountResult[0]?.value ?? 0,
        totalCustomers: customerCountResult[0]?.value ?? 0,
    });
});

export default app;
