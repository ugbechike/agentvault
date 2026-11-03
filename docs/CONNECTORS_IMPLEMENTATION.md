# Connectors

A connector is a provider adapter plus a `user_connections` row. The marketplace also lists planned providers that have no adapter.

## Contract

`ConnectorAdapter` in `apps/api/src/modules/connectors/adapters/connector-adapter.ts`:

- `provider`
- `remoteMcpEndpoint`
- `initializeConnection`
- `retrieveCredential`
- `validateConnection`
- `discoverTools`
- `invokeTool`
- `disconnect`

`connector-registry.ts` maps `demo`, `github`, and `supabase` to adapters that talk to the upstream MCP client. `assertPublicDemoProvider` rejects every provider except `demo` on connect, validate, invoke, and OAuth start.

`POST /api/connections` does not create the demo connection. For `demo` it returns 400 `OAUTH_REQUIRED`. The demo row is created by `GET /api/oauth/demo/callback`.

## Demo

File: `adapters/demo/demo.adapter.ts`.

Endpoint constant: `DEMO_REMOTE_MCP_URL = https://example-server.modelcontextprotocol.io/mcp`.

Authorization is the demo provider's OAuth flow, including dynamic client registration. The exposed tools are the synthetic read actions in `illustrativeAllowlist` (`echo`, `add`, `getTinyImage`, `annotatedMessage`, `getResourceReference`). Other discovered tools are stored and kept disabled.

## GitHub

File: `adapters/github/github.adapter.ts`.

Endpoint constant: `GITHUB_REMOTE_MCP_URL = https://api.githubcopilot.com/mcp/`.

The adapter can validate, discover, and invoke, but the public demo never starts a GitHub connection. Catalog status is `planned`. The allowlist names are `github_get_file`, `github_list_commits`, `github_list_issues`, `github_read_issue`, `github_search_repositories`, and `github_write_issue`, bound to `get_file_contents`, `list_commits`, `list_issues`, `issue_read`, `search_repositories`, and `issue_write`. `search_repositories` is denied once repository restrictions are saved.

There is no project ref. A shared `GITHUB_MCP_TOKEN` is not a connection.

## Supabase

File: `adapters/supabase/supabase.adapter.ts`.

Endpoint constant: `SUPABASE_REMOTE_MCP_URL = https://mcp.supabase.com/mcp`. `initializeConnection` requires `projectRef` and then returns 503 `SUPABASE_OAUTH_UNAVAILABLE`. The public demo also rejects the provider before that. `execute_sql` is not on the allowlist. `supabase_list_tables` maps to `list_tables`.

The upstream client adds `project_ref` and `read_only=true` when a Supabase config is built. The public demo does not reach that path.

## Adding a provider

1. Add the id to `connectableProviders` and `connectorCatalog` in `packages/shared`.
2. Add capabilities only if they are real grants for that provider. Do not reuse `demo.read` or `github.read`.
3. Create `adapters/<provider>/<provider>.adapter.ts` implementing `ConnectorAdapter`.
4. Register it in `connector-registry.ts`.
5. Allow it through `assertPublicDemoProvider` only when the public demo should expose it.
6. Add a connect flow under `apps/web` if the authorization steps differ.
7. Extend `illustrativeAllowlist` only with names discovery can match exactly. Unmatched discovered tools stay disabled.

Planned catalog entries (`gmail`, `google-drive`, `notion`) have no adapter and no connect route.

## Persistence

Tables: `connector_definitions`, `user_connections`, `discovered_tools`, `connection_secrets`. Status and capability strings are validated by Zod in the app, not by Postgres enums. `discovered_tools.enabled` is true only when the upstream name matches the allowlist for that provider. Startup inserts missing catalog rows for `demo`, `github`, and `supabase`.
