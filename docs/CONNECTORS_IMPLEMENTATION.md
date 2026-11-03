# Connectors

A connector is a provider adapter plus a `user_connections` row. The marketplace in the UI also lists planned providers that have no adapter.

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

`connector-registry.ts` maps `github` and `supabase` to their skeletons. `getConnectorAdapter` does not open a socket. Every method rejects with `NotImplementedError`.

HTTP routes in `connectors.routes.ts` parse input and call `connection.service.ts`, which also rejects. `POST /api/connections` looks up the adapter and then throws `TODO(MCP-LEARNING): Handle upstream authentication` without calling it.

## GitHub

File: `adapters/github/github.adapter.ts`.

Endpoint constant: `GITHUB_REMOTE_MCP_URL = https://api.githubcopilot.com/mcp/`. Confirm it against current GitHub docs before you connect.

GitHub tools are whatever that server lists. The UI fixtures use example upstream names (`list_repositories`, `get_file_contents`, `create_issue`) and AgentVault names (`github_list_repositories`, `github_get_file`, `github_create_issue`). Bind them only after discovery.

Auth is GitHub's, not Supabase's. There is no project ref.

## Supabase

File: `adapters/supabase/supabase.adapter.ts`.

Endpoint constant: `SUPABASE_REMOTE_MCP_URL = https://mcp.supabase.com/mcp`. Scope with `project_ref` when you build the URL. Read-only can be a separate query flag on that server; model that as `supabase.read` versus `supabase.write` in AgentVault, and confirm which upstream tools belong to each.

`InitializeConnectionInput.projectRef` exists for this provider. The GitHub wizard does not collect one.

## Adding a provider

1. Add the id to `connectableProviders` and `connectorCatalog` in `packages/shared`.
2. Add capabilities only if they are real grants for that provider. Do not reuse `github.read`.
3. Create `adapters/<provider>/<provider>.adapter.ts` implementing `ConnectorAdapter`.
4. Register it in `connector-registry.ts`.
5. Add a connect flow under `apps/web` if the authorization steps differ.
6. Extend `illustrativeAllowlist` only with names you are willing to expose. Leave `discoverTools` unimplemented until it calls `discoverUpstreamTools`.

Planned catalog entries (`gmail`, `google-drive`, `notion`) have no adapter and no connect route. Their detail page says the connector is coming later.

## Authorization

GitHub uses an OAuth App (authorization code + PKCE). The access token is encrypted in `connection_secrets`. The connection row stores that row's id. A shared `GITHUB_MCP_TOKEN` is not a connection.

Supabase OAuth is not configured. `initializeConnection` refuses the connector, and `execute_sql` is not on the allowlist.

The connectors UI calls these **test connections**. Keep environment variable names, credential references, remote MCP URLs, transport details, and unfinished OAuth notes in this document or in development diagnostics such as the MCP access page. The marketplace, connect flows, connection detail, dashboard connection health, and agent access screens should say what the connection lets agents do and that the person chooses which agents can use it.

## Persistence

Tables: `connector_definitions`, `user_connections`, `discovered_tools`. Status and capability strings are validated by Zod in the app, not by Postgres enums. `discovered_tools.enabled` defaults to false so a newly discovered tool is not exposed until the allowlist says so.
