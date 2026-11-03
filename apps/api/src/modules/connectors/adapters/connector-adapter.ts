import type {
  ConnectionValidation,
  CredentialLookup,
  CredentialReference,
  DisconnectInput,
  DiscoveredToolRecord,
  DiscoverToolsInput,
  InitializeConnectionInput,
  InvokeToolInput,
  ProviderId,
  ToolCallResult,
  ValidateConnectionInput,
} from "@agentvault/shared";

export interface ConnectionInitResult {
  authorizationRequired: boolean;
  provider: ProviderId;
}

/**
 * One adapter per provider. GitHub and Supabase do not share an auth flow or a tool list.
 * Every method stays unimplemented until the provider integration is written.
 */
export interface ConnectorAdapter {
  readonly provider: ProviderId;
  readonly remoteMcpEndpoint: string;
  initializeConnection(input: InitializeConnectionInput): Promise<ConnectionInitResult>;
  retrieveCredential(input: CredentialLookup): Promise<CredentialReference>;
  validateConnection(input: ValidateConnectionInput): Promise<ConnectionValidation>;
  discoverTools(input: DiscoverToolsInput): Promise<DiscoveredToolRecord[]>;
  invokeTool(input: InvokeToolInput): Promise<ToolCallResult>;
  disconnect(input: DisconnectInput): Promise<void>;
}
