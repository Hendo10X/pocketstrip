# OpenAPI/Swagger Documentation Setup

This API includes comprehensive OpenAPI 3.0.0 documentation with multiple documentation viewers.

## Accessing Documentation

### 1. **Swagger UI** (Recommended)
- **URL:** `http://localhost:4000/docs`
- **Features:**
  - Interactive API exploration
  - Try out endpoints directly from the browser
  - Request/response examples
  - Schema visualization

### 2. **ReDoc**
- **URL:** `http://localhost:4000/redoc`
- **Features:**
  - Clean, organized documentation layout
  - Mobile-friendly
  - Search functionality
  - Best for API consumers

### 3. **Raw OpenAPI Specification**
- **URL:** `http://localhost:4000/openapi.json`
- **Format:** JSON
- **Usage:** Import into Postman, IntelliJ, or other API tools

## How It Works

The API uses `@hono/zod-openapi` to automatically generate OpenAPI documentation from Zod schemas.

### Environment Variables

The OpenAPI spec respects these environment variables:

- `API_URL` - The base URL of your API (defaults to `http://localhost:4000`)
- `DASHBOARD_URL` - Allowed CORS origin (defaults to `http://localhost:3000`)

Example:
```bash
API_URL=https://api.pocketstrip.com bun run dev
```

## Route Documentation

Each route module should include OpenAPI documentation. The schema definitions are centralized in `lib/openapi-schemas.ts`.

### Adding Documentation to Routes

Example route with OpenAPI docs:

```typescript
import { z } from "zod";
import { createRoute } from "@hono/zod-openapi";
import { Hono } from "hono";

const route = createRoute({
  method: "get",
  path: "/projects/{projectId}",
  tags: ["Projects"],
  summary: "Get project details",
  description: "Retrieve detailed information about a specific project",
  request: {
    params: z.object({
      projectId: z.string().uuid().describe("The project ID"),
    }),
  },
  responses: {
    200: {
      description: "Project details",
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
    },
    404: {
      description: "Project not found",
    },
  },
});

const app = new Hono();

app.openapi(route, (c) => {
  // Handler logic
  return c.json({ /* response */ });
});
```

## Testing

To test the API with documentation:

1. Start the development server: `bun run dev`
2. Open `http://localhost:4000/docs`
3. Find an endpoint and click "Try it out"
4. Fill in parameters and click "Execute"
5. View the response

## Integration with External Tools

### Postman
1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:4000/openapi.json`
4. Select "OpenAPI 3.0" as the format
5. Click "Import"

### IntelliJ / WebStorm
1. Go to Tools → HTTP Client → Import cURL/HTTP Request
2. Enter the OpenAPI URL in preferences
3. Auto-completion will work in `.http` files

### API Gateway / API Management
Export the OpenAPI spec to AWS API Gateway, Azure API Management, Kong, etc.

## Maintenance

- Keep `lib/openapi-schemas.ts` updated with new schemas
- Update route documentation when API changes
- Test documentation endpoints regularly
- Keep the version number in sync with your API releases

## References

- [Hono Documentation](https://hono.dev/)
- [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Zod Documentation](https://zod.dev/)
