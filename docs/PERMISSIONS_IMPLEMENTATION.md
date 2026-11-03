# Permissions

```text
effective access = provider-granted access ∩ AgentVault agent policy
```

Both sides are required. A tool the provider allows is still denied when the agent policy does not include that capability. An agent policy cannot widen a missing provider grant.

## Types

`packages/shared/src/types/permissions.ts`

- `PermissionCheckRequest` — ids only. This is what `POST /api/permissions/evaluate` accepts. It has no `allowed` field.
- `EffectiveAccessInput` — server-loaded `providerGranted`, `agentAllowed`, `toolAllowlisted`, `connectionActive`, `agentActive`.
- `PermissionDecision` — `outcome` of `allow` or `deny` plus a `reasonCode`.

Reason codes already named: `ALLOWED`, `PROVIDER_SCOPE_MISSING`, `AGENT_POLICY_DENY`, `TOOL_NOT_ALLOWLISTED`, `CONNECTION_INACTIVE`, `AGENT_REVOKED`, `EVALUATION_NOT_IMPLEMENTED`.

Capabilities today: `github.read`, `github.write`, `supabase.read`, `supabase.write`. Illustrative tools in `constants/tools.ts` point at the capability they will require.

## Fail closed

`evaluateEffectiveAccess` and `intersectAccess` in `apps/api/src/modules/permissions/policies/effective-access.ts` throw `NotImplementedError`. They do not return `allow`. The HTTP route returns 501 for a valid body and 400 for an invalid one.

When you implement `intersectAccess`, deny unless every one of these is true:

1. The connection is active.
2. The agent is active.
3. The AgentVault tool name is on the explicit allowlist for that connection.
4. `requiredCapability` is in `providerGranted`.
5. `requiredCapability` is in `agentAllowed`.

Load grants from `user_connections` and `agent_permissions`. Do not accept them from the MCP client.

Call `evaluateEffectiveAccess` inside `handleToolsCall` for every invocation. `filterToolsForAgent` may hide tools from `tools/list`. Hiding them is not the check.

## Browser preview

`apps/web/src/modules/permissions/preview.ts` computes the same intersection for labels on the permissions and agent screens. `demoReducer` refuses to store an agent allow when the simulated provider grant is off, and clearing a provider grant clears matching agent allows.

That reducer is not enforcement. The activity table is seeded sample data, including a row whose decision says allow and whose status is failure, so a fixture allow is not a successful call.

## Routes still unimplemented

- `GET /api/permissions`
- `PUT /api/permissions`
- `POST /api/permissions/evaluate`
- `GET /api/audit`

`recordAuditLog` throws so a 501 path cannot insert a row that claims a tool ran.
