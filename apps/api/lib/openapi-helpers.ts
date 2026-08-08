import { createRoute, z } from "@hono/zod-openapi";

/**
 * Helper to create documented API routes with proper OpenAPI specs
 */

export const createApiRoute = (config: {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  requestBody?: any;
  params?: any;
  responses: Record<
    number,
    {
      description: string;
      schema?: any;
    }
  >;
}) => {
  const responses: Record<string, any> = {};

  Object.entries(config.responses).forEach(([status, spec]) => {
    responses[status] = {
      description: spec.description,
      ...(spec.schema && {
        content: {
          "application/json": {
            schema: spec.schema,
          },
        },
      }),
    };
  });

  return createRoute({
    method: config.method,
    path: config.path,
    tags: config.tags,
    summary: config.summary,
    description: config.description,
    request: {
      ...(config.params && { params: config.params }),
      ...(config.requestBody && {
        body: {
          content: {
            "application/json": {
              schema: config.requestBody,
            },
          },
        },
      }),
    },
    responses,
  });
};

/**
 * Common HTTP status code schemas
 */

export const StatusOkSchema = z.object({
  status: z.literal("ok"),
});

export const StatusErrorSchema = z.object({
  error: z.string(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int(),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(schema: T) => {
  return z.object({
    data: z.array(schema),
    pagination: PaginationSchema,
  });
};

/**
 * Common error responses
 */

export const errorResponses = {
  400: { description: "Bad Request" },
  401: { description: "Unauthorized - Invalid or missing API key" },
  403: { description: "Forbidden - Insufficient permissions" },
  404: { description: "Not Found" },
  409: { description: "Conflict - Resource already exists" },
  500: { description: "Internal Server Error" },
};
