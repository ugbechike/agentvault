# AgentVault POC

Experimental MCP gateway and connector permission broker. The UI is a browser demo. The API boots without OAuth credentials, a database, or an MCP server. Protocol, provider auth, and permission enforcement are left unimplemented on purpose.

## Run

```bash
cd agentvault-poc
pnpm install
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/health

Demo sign-in, shown on the form: `ada@agentvault.dev` / `vault-demo`. That check happens in the browser.

Copy `.env.example` to `.env` only when you want to point the web app at another API URL or later connect Supabase Postgres. Neither file is required to boot.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js and the Fastify API together |
| `pnpm test` | Vitest in shared, API, and web |
| `pnpm typecheck` | `tsc --noEmit` in each package |
| `pnpm lint` | ESLint in each package |
| `pnpm build` | API bundle via tsup, then `next build` |
| `pnpm --filter @agentvault/api db:generate` | Drizzle migration from `apps/api/src/db/schema` |

## Where the product is mocked

The signed-in workspace, connector setup, agent grants, and activity log are stored in `localStorage` (`agentvault-poc-demo-v1`). A banner states that. Reset it from Settings.

`GET /health` and `GET /` are real. Other API routes validate with Zod and return **501** with `error.code = NOT_IMPLEMENTED`. `POST /mcp` does the same. They do not return fake success.

## Where to implement MCP

Upstream client:

- `apps/api/src/modules/mcp/upstream/client-factory.ts`
- `apps/api/src/modules/mcp/upstream/client-manager.ts`
- `apps/api/src/modules/mcp/upstream/tool-discovery.ts`
- `apps/api/src/modules/mcp/upstream/tool-invocation.ts`

Downstream server:

- `apps/api/src/modules/mcp/downstream/server.ts`
- `apps/api/src/modules/mcp/downstream/transport.ts`
- `apps/api/src/modules/mcp/downstream/tool-registry.ts`
- `apps/api/src/modules/mcp/downstream/tool-handlers.ts`

Gateway mapping, filtering, and routing:

- `apps/api/src/modules/mcp/gateway/`

Read `docs/MCP_IMPLEMENTATION.md` before writing those files. Related boundaries are in `docs/AUTH_IMPLEMENTATION.md`, `docs/CONNECTORS_IMPLEMENTATION.md`, and `docs/PERMISSIONS_IMPLEMENTATION.md`.

## SDK choices

- MCP SDK **v2**: `@modelcontextprotocol/server` and `@modelcontextprotocol/client` at 2.4.0, plus `@modelcontextprotocol/node` 2.1.2 and `@modelcontextprotocol/fastify` 2.0.1. The v1 package `@modelcontextprotocol/sdk` is not installed.
- TypeScript **5.9.3**. TypeScript 7.0.2 is on npm, and `typescript-eslint` 8.72.1 only accepts TypeScript below 6.1.
- ESLint **9.39.5**. ESLint 10 is published, and `eslint-config-next` 16.4.4 still depends on plugins that peer to ESLint 9.
- Vitest **3.2.7**, with its Vite dependency pinned to 6.4.5. Vitest 5 resolves Vite 8 and Rolldown, which import `node:util` `styleText` (Node 20.12+). Next.js 16 allows Node 20.9. Vitest 3 also cannot load the Vite 7 copy Next uses, so that edge is overridden in `pnpm-workspace.yaml`.
- tsup **8.5.1**. tsup 9 depends on an ESM-only `cac` that Node 20.9 cannot `require()`. Node 20.19+ can. The API bundle still uses tsup so `@/` imports resolve at build time.
- Next.js 16 and Tailwind CSS 4 for the web app. Fastify 5, Drizzle ORM, and Zod 4 for the API.
- Postgres is reached with `postgres` and Drizzle when `DATABASE_URL` is set. The client is lazy.
