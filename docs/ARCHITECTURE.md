# Architecture

AgentVault POC is a pnpm workspace. The web app is a Next.js client of a Fastify API. MCP protocol code is isolated under `apps/api/src/modules/mcp` and is not started with the HTTP server.

## Packages

| Path | Role |
| --- | --- |
| `apps/web` | Dashboard UI. Deployable to Vercel. Uses browser fixtures. |
| `apps/api` | Fastify API. Deployable to Railway. `GET /health` is live. Integration routes return 501. |
| `packages/shared` | Zod input contracts, capability and provider constants, record types. |

`@/` maps to `src/` inside each app. Shared code is imported as `@agentvault/shared`.

## Request path

```text
Browser UI  --mock state-->  local storage
Browser UI  --optional---->  GET /health
HTTP client --Zod--------->  route -> service -> 501
MCP client  --future------>  /mcp -> downstream server -> permission check -> upstream client -> provider MCP
```

The UI does not call the 501 routes. Doing so would surface an error, which is intentional.

## API modules

- `modules/auth` — dashboard registration, login, refresh, password hashing, and a separate MCP consumer authenticator.
- `modules/users` — profile reads and updates.
- `modules/connectors` — adapter contract, GitHub adapter, Supabase adapter, registry, connection service.
- `modules/agents` — external MCP consumers.
- `modules/permissions/policies` — fail-closed effective access.
- `modules/audit` — activity persistence, not the sample rows in the UI.
- `modules/mcp/downstream` — AgentVault as an MCP server.
- `modules/mcp/upstream` — AgentVault as an MCP client.
- `modules/mcp/gateway` — allowlist mapping, filtering, and routing.

`src/server.ts` listens and does not call `createDownstreamMcpServer`.

## Database

Drizzle schemas live in `apps/api/src/db/schema`. `getDatabase()` connects only when something calls it and `DATABASE_URL` is set. Boot does not open Postgres. `encrypted_credential_reference` is an opaque pointer. Do not store OAuth tokens in it.

`audit_logs.duration_ms` is nullable and extra to the original column list so the activity screen has a place to persist duration later.

## UI modules

`apps/web/src/modules/demo` holds the browser workspace. Presentational components live under `components/`. Copy and preview rules live under `modules/`.

## Deployment

- Vercel project root: `apps/web`.
- Railway project root: the monorepo root (`agentvault-poc`), using `railway.toml`. Health check path: `/health`.
