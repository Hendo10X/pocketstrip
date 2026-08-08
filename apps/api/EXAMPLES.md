/**
 * Example: Adding OpenAPI Documentation to Your Routes
 * 
 * This is a reference implementation showing best practices for documenting
 * routes in the Pocketstrip API using @hono/zod-openapi.
 */

import { Hono } from "hono";
import { z } from "zod";
import * as OpenAPISchemas from "../lib/openapi-schemas";

// Example 1: Simple GET endpoint
// Usage: GET /api/example/health
export const healthRoute = new Hono()
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  });

// Example 2: GET with path parameters
// Usage: GET /api/example/customers/:customerId
const CustomerDetailSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  created: z.string().datetime(),
});

export const customerDetailRoute = new Hono()
  .get("/:customerId", async (c) => {
    const customerId = c.req.param("customerId");
    
    // Your database query would go here
    // const customer = await db.query.customers.findFirst({
    //   where: eq(customers.id, customerId),
    // });
    
    return c.json({
      id: customerId,
      name: "John Doe",
      email: "john@example.com",
      created: new Date().toISOString(),
    });
  });

// Example 3: POST endpoint with request body
// Usage: POST /api/example/customers
const CreateCustomerSchema = z.object({
  name: z.string().describe("Customer's full name").optional(),
  email: z.string().email().describe("Customer's email address"),
  metadata: z.record(z.string()).optional().describe("Additional metadata"),
});

export const createCustomerRoute = new Hono()
  .post("/", async (c) => {
    const body = await c.req.json();
    
    // Validate with Zod
    const parsed = CreateCustomerSchema.parse(body);
    
    // Your database insert would go here
    // const newCustomer = await db.insert(customers).values({
    //   email: parsed.email,
    //   name: parsed.name,
    // }).returning();
    
    return c.json({
      id: "cust_123",
      email: parsed.email,
      name: parsed.name,
      created: new Date().toISOString(),
    }, { status: 201 });
  });

// Example 4: Endpoint with authentication
// Usage: GET /api/example/protected
export const protectedRoute = new Hono()
  .get("/protected", (c) => {
    // Middleware would validate API key before reaching this handler
    const project = c.get("project");
    
    return c.json({
      message: "This is protected",
      project: project.name,
    });
  });

// Example 5: Endpoint with query parameters
// Usage: GET /api/example/customers?page=1&limit=10&status=active
const CustomerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["active", "inactive", "all"]).default("all"),
  search: z.string().optional(),
});

export const customerListRoute = new Hono()
  .get("/", async (c) => {
    const query = CustomerListQuerySchema.parse(c.req.query());
    
    // Your database query with filters
    // const customers = await db.query.customers.findMany({
    //   limit: query.limit,
    //   offset: (query.page - 1) * query.limit,
    // });
    
    return c.json({
      data: [
        {
          id: "cust_1",
          name: "John Doe",
          email: "john@example.com",
          created: new Date().toISOString(),
        },
      ],
      pagination: {
        page: query.page,
        pageSize: query.limit,
        total: 1,
      },
    });
  });

// Example 6: Error handling pattern
// Usage: GET /api/example/customers/:customerId/subscriptions
export const subscriptionListRoute = new Hono()
  .get("/:customerId/subscriptions", async (c) => {
    const customerId = c.req.param("customerId");
    
    if (!customerId) {
      return c.json({ error: "Customer ID is required" }, 400);
    }
    
    // Your database query
    // const subscriptions = await db.query.subscriptions.findMany({
    //   where: eq(subscriptions.customerId, customerId),
    // });
    
    return c.json({
      customerId,
      subscriptions: [],
    });
  });

// Export all routes to combine in main API
export default {
  healthRoute,
  customerDetailRoute,
  createCustomerRoute,
  protectedRoute,
  customerListRoute,
  subscriptionListRoute,
};
