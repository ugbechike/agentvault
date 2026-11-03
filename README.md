# AgentVault POC

MCP gateway and permission broker for a safe public demo. A person signs in with a provisioned demo account, approves the hosted demo MCP provider, registers an MCP Inspector connection, and AgentVault checks that connection's permissions before it calls the demo provider.

GitHub and Supabase adapters remain in the codebase. The public demo does not start those connections.

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

Public registration is disabled. Sign in with a demo account created by `pnpm seed:demo:production`. The demo provider connects through its own authorization callback. A shared provider token is not a connection.

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

Do not change production until these are set. Do not print secret values.

- Vercel root directory `apps/web`. `NEXT_PUBLIC_API_URL` is the Railway API origin, for example `https://api-production-0c2b.up.railway.app`.
- Railway root is this package (`railway.toml`). `WEB_ORIGIN` is the Vercel origin, for example `https://web-navy-pi-61.vercel.app`. `API_PUBLIC_URL` is the Railway origin. Keep `DATABASE_URL`, `JWT_SECRET`, and `CREDENTIAL_ENCRYPTION_KEY`. The demo provider uses dynamic registration and does not need a client secret.
- The demo callback is `{API_PUBLIC_URL}/api/oauth/demo/callback`.
- Apply existing migrations only after confirming the production schema. Then provision accounts with `CONFIRM_PRODUCTION_SEED=agentvault-demo DATABASE_URL=... DEMO_CREDENTIALS_FILE=/absolute/path/outside/the/repo.txt pnpm seed:demo:production`. The command prints the database host and name, not the connection string or passwords. Passwords are written once to that file, mode 0600.
- Health check: `GET /health`. Downstream MCP: `POST /mcp`.

Password reset email is not configured. Change a password from Settings after signing in.
