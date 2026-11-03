# AgentVault POC

MCP gateway and permission broker. A person signs in, authorizes their own GitHub account, registers an external MCP client, and AgentVault checks that client's permissions before it calls GitHub's remote MCP server.

## Run locally

```bash
cd agentvault-poc
pnpm install
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, and the GitHub OAuth app values. See .env.example.
pnpm --filter @agentvault/api db:migrate
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/health
- Downstream MCP: http://localhost:4000/mcp

Create an account in the web app. GitHub connects only through the OAuth callback. A shared `GITHUB_MCP_TOKEN` is not a user connection.

Register the OAuth app callback as `{API_PUBLIC_URL}/api/oauth/github/callback`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js and the Fastify API together |
| `pnpm test` | Vitest in shared, API, and web |
| `pnpm typecheck` | `tsc --noEmit` in each package |
| `pnpm lint` | ESLint in each package |
| `pnpm build` | API bundle via tsup, then `next build` |
| `pnpm --filter @agentvault/api db:migrate` | Apply Drizzle migrations, including the connector catalog seed |

## GitHub authorization

AgentVault uses a GitHub OAuth App with authorization code and PKCE. The resulting user access token is encrypted at rest. `user_connections.encrypted_credential_reference` stores the secret row id, not the token. After the token exchange, AgentVault calls GitHub's remote MCP server at `https://api.githubcopilot.com/mcp/`. The connection is marked connected only when that server accepts the credential and returns tools.

The exposed tools are an allowlist matched to the current GitHub MCP catalog (`get_file_contents`, `list_commits`, `list_issues`, `issue_read`, `search_repositories`, `issue_write`). Other discovered tools are stored and kept disabled. `search_repositories` is denied once repository restrictions are saved, because a search query can reach other repositories.

## Agents and MCP clients

Registering an agent returns a credential once (`avmcp_…`). Only its SHA-256 hash is stored. Cursor and Claude Code should use Streamable HTTP against `/mcp` with `Authorization: Bearer <that credential>`. The dashboard JWT is not an MCP credential. ChatGPT's remote MCP connection was not tested.

## Supabase

Supabase stays disconnected. A project-scoped OAuth client is not configured, and `execute_sql` is not treated as a read-only tool. When a future connection is added, the upstream URL must include `project_ref` and `read_only=true`.

## Deploy

Do not deploy until GitHub OAuth, `JWT_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, and `DATABASE_URL` are set in the host, and the OAuth callback uses the public API URL.

- Vercel: this repository, with Root Directory `apps/web`, so the pnpm workspace can still install `@agentvault/shared`. Set `NEXT_PUBLIC_API_URL` to the Railway API origin. The GitHub OAuth callback stays on the API, not on Vercel.
- Railway: repository root (`railway.toml`). Set `WEB_ORIGIN` to the Vercel origin and `API_PUBLIC_URL` to the Railway origin. Run `pnpm --filter @agentvault/api db:migrate` against the production database before serving traffic. `db:migrate` reads `agentvault-poc/.env` when `DATABASE_URL` is not already in the environment.
- Health check: `GET /health`.

Password reset email is not configured. Change a password from Settings after signing in.
