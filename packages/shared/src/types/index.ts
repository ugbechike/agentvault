export type { AgentClientKind, AgentRecord, AgentStatus } from "./agents";
export type { AuditLogRecord, AuditStatus } from "./audit";
export type { DashboardSession, McpConsumerIdentity, UserProfile } from "./auth";
export type {
  ConnectionStatus,
  ConnectionValidation,
  CredentialLookup,
  CredentialReference,
  DiscoveredToolRecord,
  DisconnectInput,
  DiscoverToolsInput,
  InitializeConnectionInput,
  InvokeToolInput,
  UserConnection,
  ValidateConnectionInput,
} from "./connectors";
export type {
  DownstreamToolContext,
  MappedAgentVaultTool,
  McpTransportName,
  ToolCallRequest,
  ToolCallResult,
  ToolContentText,
  UpstreamConnectionConfig,
  UpstreamToolDefinition,
} from "./mcp";
export { IntegrationError } from "./mcp";
export type {
  AgentPermissionRecord,
  EffectiveAccessInput,
  PermissionCheckRequest,
  PermissionDecision,
  PermissionOutcome,
  PermissionReasonCode,
} from "./permissions";
