# Architecture

AgentVault POC is a pnpm workspace. The web app is a Next.js client of a Fastify API. The same API process serves dashboard routes and the downstream MCP endpoint.

## Packages

| Path | Role |
| --- | --- |
| `apps/web` | Dashboard UI. Deployable to Vercel. Calls the API with the dashboard bearer token. |
| `apps/api` | Fastify API. Deployable to Railway. `GET /health`, dashboard routes, and `GET`/`POST`/`DELETE /mcp` are live. |
| `packages/shared` | Zod input contracts, capability and provider constants, record types. |

`@/` maps to `src/` inside each app. Shared code is imported as `@agentvault/shared`.

## Request path

```text
Browser UI  --Bearer JWT-->  /api/* -> service -> Postgres
MCP client  --avmcp_ token-> /mcp -> downstream server -> permission check -> upstream client -> demo MCP
```

`WEB_ORIGIN` is the only browser origin allowed to call the API. CORS allows `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, and `DELETE`. The dashboard sends `PUT` when it saves agent access.

GitHub and Supabase adapters are still registered. Public demo routes reject every provider except `demo` before those adapters run.

## API modules

- `modules/auth` — demo-account login, refresh, logout, password hashing, and MCP consumer authentication. `POST /api/auth/register` is disabled.
- `modules/users` — profile reads, updates, and password changes.
- `modules/connectors` — demo, GitHub, and Supabase adapters, the connection service, and demo OAuth. Only the demo provider can be connected.
- `modules/agents` — external MCP consumers and one-time `avmcp_` credentials.
- `modules/permissions/policies` — fail-closed effective access, including per-tool and resource checks.
- `modules/audit` — rows written by tool calls and listed by `GET /api/audit`.
- `modules/mcp/downstream` — AgentVault as an MCP server, mounted by `buildApp`.
- `modules/mcp/upstream` — AgentVault as an MCP client of a connected provider.
- `modules/mcp/gateway` — allowlist mapping, filtering, and routing.

`src/server.ts` listens on the app from `buildApp`. That app mounts `/mcp` through `createDownstreamTransport`.

## Database

Drizzle schemas live in `apps/api/src/db/schema`. `getDatabase()` connects on first use when `DATABASE_URL` is set. Startup uses it for the connector catalog seed and the health check. `user_connections.encrypted_credential_reference` stores the id of a `connection_secrets` row. The provider token is the ciphertext in that row, not the reference itself.

`audit_logs.duration_ms` records how long a tool call took.

## UI modules

Dashboard screens under `apps/web/src/components` call `apiRequest`. The browser session is `agentvault-session-v1` in `localStorage`. `apps/web/src/modules/demo` is an unused fixture workspace. The sign-in form does not use it.

## Deployment

- Vercel project root: `apps/web`.
- Railway project root: this package (`agentvault-poc`), using `railway.toml`. Health check path: `/health`.
- The Railway service is deployed with `railway up` from this directory. It is not connected to the GitHub repo, so a dashboard redeploy rebuilds the last CLI upload.
