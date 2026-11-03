# Auth implementation

AgentVault has three separate credentials. They are not interchangeable.

## 1. Dashboard authentication

The person using the website.

| Piece | File | Current behavior |
| --- | --- | --- |
| Routes | `apps/api/src/modules/auth/routes/auth.routes.ts` | `POST /api/auth/register`, `login`, `logout`, `refresh`, `forgot-password`, `GET /api/auth/session` validate with Zod, then 501. |
| Service | `modules/auth/services/auth.service.ts` | Throws before any user row is written. |
| Passwords | `modules/auth/services/password.service.ts` | `hash` and `verify` throw. Plaintext must never be logged or stored. |
| JWT | `modules/auth/services/token.service.ts` | `issueDashboardSession`, `verifyAccessToken`, `rotateRefreshToken` throw. `JWT_SECRET` is parsed and unused. |
| Users | `modules/auth/repositories/user.repository.ts` | Throws. Future reads go through `getDatabase()`. |
| Profile | `modules/users/routes/users.routes.ts` | `GET` and `PATCH /api/users/me` return 501. |

The web sign-in screen calls `mockSignIn` in `apps/web/src/modules/auth/mock-auth.ts`. The only accepted password is the one printed on the form (`ada@agentvault.dev` / `vault-demo`). Sign-up writes a session to `localStorage` under `agentvault-poc-demo-v1`. The banner on every screen says this.

## 2. Provider authorization

The grant AgentVault holds for GitHub or Supabase on behalf of the user.

- GitHub: OAuth or another user-approved GitHub credential, then the remote MCP server at `https://api.githubcopilot.com/mcp/`. See `github.adapter.ts`.
- Supabase: OAuth scoped to one project ref, then `https://mcp.supabase.com/mcp`. See `supabase.adapter.ts`. Do not reuse the GitHub token or the dashboard JWT.

`retrieveCredential` must return a `CredentialReference` string that points at a secret store. The column is `user_connections.encrypted_credential_reference`. Environment placeholders `GITHUB_OAUTH_*` and `SUPABASE_OAUTH_*` are optional and unread.

The connect wizards set a browser flag. They do not redirect.

## 3. MCP consumer authentication

The credential a Cursor or Claude Code process presents to AgentVault.

`authenticateMcpConsumer` in `modules/auth/services/mcp-consumer-auth.service.ts` and `authenticateCaller` in `modules/mcp/downstream/tool-handlers.ts` both throw with `TODO(MCP-LEARNING): Authenticate MCP caller`.

That check belongs in front of `createMcpHandler`, which does not read tokens. The MCP access page shows `Bearer <MCP consumer credential — not issued>` and does not generate a token.

A dashboard session cookie must not be accepted as an MCP bearer token unless you explicitly design that bridge later.
