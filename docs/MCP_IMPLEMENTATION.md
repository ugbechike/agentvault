# MCP implementation

`/mcp` is a Streamable HTTP MCP server on the Fastify process. Tool calls for the public demo go to the hosted demo provider after the allowlist and permission checks.

## Call path

```text
Cursor or Claude Code
  -> AgentVault downstream MCP server (Streamable HTTP, POST/GET/DELETE /mcp)
  -> authenticate MCP caller (avmcp_ bearer token)
  -> tools/list or tools/call
  -> allowlist + evaluateEffectiveAccess
  -> gateway router
  -> AgentVault upstream MCP client
  -> demo MCP (https://example-server.modelcontextprotocol.io/mcp)
```

GitHub (`https://api.githubcopilot.com/mcp/`) and Supabase (`https://mcp.supabase.com/mcp?project_ref=...&read_only=true`) are implemented in the upstream client. `assertPublicDemoProvider` rejects those providers before a public-demo call connects.

`apps/api/src/modules/mcp/routes.ts` authenticates the caller, checks the origin against `WEB_ORIGIN` and `API_PUBLIC_URL`, and hands the Node request to `toNodeHandler`.

## SDK

Use MCP TypeScript SDK v2. Do not add `@modelcontextprotocol/sdk` (v1).

| Package | Pinned | Use |
| --- | --- | --- |
| `@modelcontextprotocol/server@2.4.0` | yes | `McpServer`, `createMcpHandler` |
| `@modelcontextprotocol/client@2.4.0` | yes | `Client`, `StreamableHTTPClientTransport`, `listTools`, `callTool` |
| `@modelcontextprotocol/node@2.1.2` | yes | `toNodeHandler` for Fastify's Node request |
| `@modelcontextprotocol/fastify@2.0.1` | yes | Declared as a dependency. The app does not call it. `/mcp` is mounted on the existing Fastify server, and origin checks live in `routes.ts`. |

Zod in this repo is 4.x. Downstream tool registration uses `z.fromJSONSchema` on the discovered input schema.

## Downstream

| File | Behavior |
| --- | --- |
| `apps/api/src/modules/mcp/downstream/server.ts` | Builds a per-request `McpServer` and registers the tools advertised for that agent. |
| `apps/api/src/modules/mcp/downstream/transport.ts` | `createMcpHandler` plus `toNodeHandler`, mounted at `/mcp`. The factory reads `authInfo.clientId` as the agent id. |
| `apps/api/src/modules/mcp/downstream/tool-handlers.ts` | `handleToolsList` lists advertised tools. `handleToolsCall` checks access, routes, invokes, and writes an audit row. `authenticateCaller` delegates to `authenticateMcpConsumer`. |
| `apps/api/src/modules/mcp/downstream/tool-registry.ts` | Enabled discovered tools that match the allowlist and the agent's grants. Unknown tools are not registered. |

The bearer token is verified in the route, before `createMcpHandler`. The handler does not verify tokens itself.

## Upstream

| File | Behavior |
| --- | --- |
| `apps/api/src/modules/mcp/upstream/client-factory.ts` | Opens a `Client` over `StreamableHTTPClientTransport`. The auth provider supplies the stored access token. Supabase URLs get `project_ref` and `read_only=true`. |
| `apps/api/src/modules/mcp/upstream/client-manager.ts` | Caches one client per connection. Refreshes an expiring demo token. Rejects a non-demo provider. |
| `apps/api/src/modules/mcp/upstream/tool-discovery.ts` | Calls `listTools()` and stores rows. Allowlist matches are enabled. |
| `apps/api/src/modules/mcp/upstream/tool-invocation.ts` | Calls `callTool` and maps the result into `ToolCallResult`. |

`UpstreamConnectionConfig` carries an endpoint and a credential reference. The access token is loaded from `connection_secrets` inside the client manager. Failures are returned as text tool errors or `AppError`s. Bearer tokens are not logged.

## Gateway

| File | Behavior |
| --- | --- |
| `gateway/tool-mapper.ts` | Maps one upstream tool onto one allowlist entry by provider and exact upstream name, or returns null. |
| `gateway/tool-filter.ts` | Drops tools the agent lacks a capability grant or an allowed tool policy for. Filtering is not the authorization check. |
| `gateway/tool-router.ts` | `routeToolCall` requires one connected account for that provider and an enabled discovered tool. `toSafeToolError` hides the upstream failure text. |

Allowlist constants are `illustrativeAllowlist` in `packages/shared/src/constants/tools.ts`. Two connected accounts for the same provider make `routeToolCall` fail with `CONNECTION_UNAVAILABLE`.
