# Auth implementation

AgentVault has three separate credentials. They are not interchangeable.

## 1. Dashboard authentication

The person using the website. Accounts are created with `pnpm seed:demo:production`. Public registration is off.

| Piece | File | Current behavior |
| --- | --- | --- |
| Routes | `apps/api/src/modules/auth/routes/auth.routes.ts` | `POST /api/auth/register` returns 403 `REGISTRATION_DISABLED`. `login`, `logout`, `refresh`, and `GET /api/auth/session` use the service. `forgot-password` returns `{ ok: true }` and does not send mail. |
| Service | `modules/auth/services/auth.service.ts` | Login loads the user, checks the password, and issues a session. |
| Passwords | `modules/auth/services/password.service.ts` | `scrypt` hash and verify. Plaintext is never logged or stored. |
| JWT | `modules/auth/services/token.service.ts` | HS256 access token (1 hour) and refresh token (14 days). Only the refresh token's SHA-256 hash is stored. |
| Users | `modules/auth/repositories/user.repository.ts` | Reads and writes `users` through `getDatabase()`. |
| Profile | `modules/users/routes/users.routes.ts` | `GET` and `PATCH /api/users/me`, and `POST /api/users/me/password`, require the dashboard bearer token. |

The sign-in form calls `loginAccount` in `apps/web/src/modules/auth/dashboard-auth.ts`, which posts to `/api/auth/login`. The session is stored in `localStorage` under `agentvault-session-v1` and sent as `Authorization: Bearer`. `mockSignIn` in `mock-auth.ts` is only used by fixture tests. It is not the sign-in screen.

## 2. Provider authorization

The grant AgentVault holds for a provider on behalf of the user.

- Demo: OAuth against `https://example-server.modelcontextprotocol.io/mcp`, with a dynamically registered public client. No client secret. `POST /api/oauth/demo/start` begins it, and `GET /api/oauth/demo/callback` stores the token and discovers tools.
- GitHub: OAuth code in `github-oauth.ts` and the remote MCP server at `https://api.githubcopilot.com/mcp/`. `POST /api/oauth/github/start` is rejected by the public-demo gate before that code runs.
- Supabase: `initializeConnection` refuses the connector. `POST /api/oauth/supabase/start` is rejected by the same gate.

The access token is encrypted in `connection_secrets`. `user_connections.encrypted_credential_reference` stores that row's id. `GITHUB_OAUTH_*` and `SUPABASE_OAUTH_*` are optional. GitHub's values are read only by the unused GitHub OAuth helper and the health check.

## 3. MCP consumer authentication

The credential a Cursor or Claude Code process presents to AgentVault.

`authenticateMcpConsumer` in `modules/auth/services/mcp-consumer-auth.service.ts` hashes the bearer token and loads an unrevoked `agent_credentials` row for an active agent. `authenticateCaller` delegates to it and runs before the `/mcp` handler. A token with three dot-separated parts is rejected, so a dashboard JWT cannot be used as an MCP credential.

Registering or rotating an agent returns `avmcp_…` once. The database stores the SHA-256 hash and a prefix.
