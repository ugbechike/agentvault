# MCP implementation

Protocol behavior is intentionally absent. The functions below throw `NotImplementedError`. Do not replace that with a stub that returns an empty tool list or a successful tool result.

## Intended call path

```text
Cursor or Claude Code
  -> AgentVault downstream MCP server (Streamable HTTP, POST/GET/DELETE /mcp)
  -> authenticate MCP caller
  -> tools/list or tools/call
  -> allowlist + evaluateEffectiveAccess
  -> gateway router
  -> AgentVault upstream MCP client
  -> GitHub MCP (https://api.githubcopilot.com/mcp/)
     or Supabase MCP (https://mcp.supabase.com/mcp?project_ref=...)
  -> provider API
```

`/mcp` is registered in `apps/api/src/modules/mcp/routes.ts` and returns 501. Replace those routes with the real handler. Do not leave the 501 wrapper in front of a working server.

## SDK

Use MCP TypeScript SDK v2. Do not add `@modelcontextprotocol/sdk` (v1).

| Package | Pinned | Use |
| --- | --- | --- |
| `@modelcontextprotocol/server@2.4.0` | yes | `McpServer`, `createMcpHandler` |
| `@modelcontextprotocol/client@2.4.0` | yes | `Client`, `StreamableHTTPClientTransport`, `listTools`, `callTool` |
| `@modelcontextprotocol/node@2.1.2` | yes | `toNodeHandler` for Fastify's Node request |
| `@modelcontextprotocol/fastify@2.0.1` | yes | Host and Origin checks via `createMcpFastifyApp` options. Peer depends on server `^2.3.0`, so it matches server 2.4.0. |

v2 serves Streamable HTTP with `createMcpHandler(factory)`. The factory runs per request. Verify the bearer token before the handler and pass `authInfo`. The handler does not verify tokens itself.

Zod in this repo is 4.x. SDK examples import `zod/v4` when a tool schema is registered. That registration belongs in your implementation, not in this scaffold.

## Downstream — start here

| File | Contract | TODO |
| --- | --- | --- |
| `apps/api/src/modules/mcp/downstream/server.ts` | `createDownstreamMcpServer(): DownstreamMcpServer` | `TODO(MCP-LEARNING): Implement downstream MCP server` |
| `apps/api/src/modules/mcp/downstream/transport.ts` | `createDownstreamTransport()` mounts Streamable HTTP at `/mcp` | `TODO(MCP-LEARNING): Implement Streamable HTTP transport` |
| `apps/api/src/modules/mcp/downstream/tool-handlers.ts` | `handleToolsList`, `handleToolsCall`, `authenticateCaller` | `TODO(MCP-LEARNING): Implement tools/list and tools/call integration` and `TODO(MCP-LEARNING): Authenticate MCP caller` |
| `apps/api/src/modules/mcp/downstream/tool-registry.ts` | `listAdvertisedTools`, `requireAllowlistedTool` | Same tools/list TODO. Unknown tools are rejected. |

`DownstreamMcpServer.createServer()` is typed as the SDK `McpServer`. `DownstreamTransport` is typed as the return of `createMcpHandler` and `toNodeHandler`. Nothing constructs them.

Suggested order when you implement:

1. Authenticate the caller in front of the handler (`authenticateMcpConsumer` in `modules/auth/services/mcp-consumer-auth.service.ts`).
2. Build a per-request `McpServer` that registers only `listAdvertisedTools` for that agent.
3. On `tools/call`, resolve the AgentVault name, call `evaluateEffectiveAccess`, then `routeToolCall`.
4. Mount with `toNodeHandler` on the existing Fastify app. Keep business routes on the same process or split them later; do not mix tool execution into `/api/*` handlers.

## Upstream — start here

| File | Contract | TODO |
| --- | --- | --- |
| `apps/api/src/modules/mcp/upstream/client-factory.ts` | `createUpstreamClient(config): Promise<UpstreamClientHandle>` | `TODO(MCP-LEARNING): Create upstream MCP client` |
| `apps/api/src/modules/mcp/upstream/client-manager.ts` | `connectUpstream`, `disconnectUpstream` | `TODO(MCP-LEARNING): Connect to remote MCP server` |
| `apps/api/src/modules/mcp/upstream/tool-discovery.ts` | `discoverUpstreamTools(connectionId)` | `TODO(MCP-LEARNING): Discover upstream tools` |
| `apps/api/src/modules/mcp/upstream/tool-invocation.ts` | `invokeUpstreamTool(request)` | `TODO(MCP-LEARNING): Invoke upstream tool` |

`UpstreamClientHandle` names the SDK `Client` and `StreamableHTTPClientTransport`. `UpstreamConnectionConfig` carries an endpoint and a credential reference, never a raw token. Provider auth headers are applied inside the adapter (`TODO(MCP-LEARNING): Handle upstream authentication`).

Discovery should call the SDK `listTools()` and return `UpstreamToolDefinition` records. Invocation should call `callTool` and map the result into `ToolCallResult`. Connection failures should surface as `IntegrationError` or `NotImplementedError`'s replacement, without logging the bearer token.

## Gateway

| File | Behavior to add |
| --- | --- |
| `gateway/tool-mapper.ts` | Map one upstream tool onto one illustrative AgentVault name, or reject it. |
| `gateway/tool-filter.ts` | Drop anything not on the allowlist. Filtering is not the authorization check. |
| `gateway/tool-router.ts` | `routeToolCall` picks a single connection. `toSafeToolError` hides credentials. |

Allowlist constants are `illustrativeAllowlist` in `packages/shared/src/constants/tools.ts`. Names such as `github_list_repositories` are AgentVault-facing examples. Compare them to real `tools/list` output before binding.

Collisions: two connections must not publish the same AgentVault name. The router throws until you define that rule.
