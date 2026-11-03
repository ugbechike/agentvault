# Permissions

```text
effective access = provider-granted access ∩ AgentVault agent policy ∩ per-tool policy ∩ resource scope
```

A tool the provider allows is still denied when the agent policy does not include that capability. An agent policy cannot widen a missing provider grant. A saved tool policy can turn one allowlisted tool off. Resource grants can deny a repository, project, or unbounded tool.

## Types

`packages/shared/src/types/permissions.ts`

- `PermissionCheckRequest` — ids only. This is what `POST /api/permissions/evaluate` accepts. It has no `allowed` field.
- `EffectiveAccessInput` — server-loaded `providerGranted`, `agentAllowed`, `toolAllowlisted`, `connectionActive`, `agentActive`.
- `PermissionDecision` — `outcome` of `allow` or `deny` plus a `reasonCode`.

Reason codes: `ALLOWED`, `PROVIDER_SCOPE_MISSING`, `AGENT_POLICY_DENY`, `TOOL_NOT_ALLOWLISTED`, `CONNECTION_INACTIVE`, `AGENT_REVOKED`, `TOOL_POLICY_DENY`, `UNKNOWN_OPERATION`, `RESOURCE_DENIED`, `RESOURCE_UNSCOPED`. `EVALUATION_NOT_IMPLEMENTED` remains in the union and is not returned.

Capabilities: `demo.read`, `github.read`, `github.write`, `supabase.read`, `supabase.write`. The public demo only grants and checks `demo.read`.

## Fail closed

`evaluateEffectiveAccess` and `intersectAccess` in `apps/api/src/modules/permissions/policies/effective-access.ts` load the agent, connection, capability grants, tool policies, and resource grants from Postgres. `intersectAccess` denies unless every one of these is true:

1. The connection is active.
2. The agent is active.
3. The AgentVault tool name is on the allowlist and discovery enabled that upstream tool for the connection.
4. `requiredCapability` is in `providerGranted`.
5. `requiredCapability` is in `agentAllowed`.

`evaluateEffectiveAccess` then denies when the tool policy is off, or when `evaluateResourceScope` rejects the arguments. Grants are loaded from `user_connections`, `agent_permissions`, `agent_tool_policies`, and `agent_resource_grants`. They are not accepted from the MCP client.

`handleToolsCall` calls `evaluateEffectiveAccess` for every invocation. `filterToolsForAgent` may hide tools from `tools/list`. Hiding them is not the check.

`PUT /api/agents/:id/access` saves the demo capability grant and the per-tool policies. It rejects a non-demo connection.

## Routes

- `GET /api/permissions`
- `PUT /api/permissions`
- `PUT /api/agents/:id/access`
- `DELETE /api/permissions/:id`
- `POST /api/permissions/evaluate`
- `GET /api/audit`

`recordAuditLog` inserts a row for each tool call, including denials. The activity screen reads those rows.

`apps/web/src/modules/permissions/preview.ts` is a fixture helper for the unused demo workspace. The permissions and agent screens call the API.
