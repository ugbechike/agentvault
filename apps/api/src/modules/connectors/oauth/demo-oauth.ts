import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { connectorDefinitions, oauthStates, userConnections } from "@/db/schema";
import { env } from "@/lib/config/env";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
import { sha256 } from "@/lib/crypto/sha256";
import { AppError } from "@/lib/errors/app-error";
import { saveConnectionCredential, type StoredProviderCredential } from "@/modules/connectors/services/credential-store";

const demoOrigin = "https://example-server.modelcontextprotocol.io";

export const demoRedirectUri = (): string =>
  `${env.API_PUBLIC_URL.replace(/\/$/, "")}/api/oauth/demo/callback`;

interface DemoEndpoints {
  resource: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint: string;
  revocationEndpoint: string | null;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
}

const normalizeOauthUrl = (value: string): string => {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  return url.toString();
};

const readJson = async (response: Response): Promise<Record<string, unknown> | null> => {
  const body = (await response.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
};

const stringField = (body: Record<string, unknown> | null, key: string): string | null => {
  const value = body?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

let endpointsPromise: Promise<DemoEndpoints> | null = null;

const loadEndpoints = async (): Promise<DemoEndpoints> => {
  const [resourceResponse, metadataResponse] = await Promise.all([
    fetch(`${demoOrigin}/.well-known/oauth-protected-resource`, { headers: { accept: "application/json" } }),
    fetch(`${demoOrigin}/.well-known/oauth-authorization-server`, { headers: { accept: "application/json" } }),
  ]);
  const resourceBody = await readJson(resourceResponse);
  const metadataBody = await readJson(metadataResponse);
  const authorizationEndpoint = stringField(metadataBody, "authorization_endpoint");
  const tokenEndpoint = stringField(metadataBody, "token_endpoint");
  const registrationEndpoint = stringField(metadataBody, "registration_endpoint");
  if (!resourceResponse.ok || !metadataResponse.ok || !authorizationEndpoint || !tokenEndpoint || !registrationEndpoint) {
    throw new AppError(502, "DEMO_OAUTH_UNAVAILABLE", "The demo provider is not available right now.");
  }
  return {
    resource: stringField(resourceBody, "resource") ?? `${demoOrigin}/`,
    authorizationEndpoint: normalizeOauthUrl(authorizationEndpoint),
    tokenEndpoint: normalizeOauthUrl(tokenEndpoint),
    registrationEndpoint: normalizeOauthUrl(registrationEndpoint),
    revocationEndpoint: stringField(metadataBody, "revocation_endpoint")
      ? normalizeOauthUrl(stringField(metadataBody, "revocation_endpoint") ?? "")
      : null,
  };
};

const endpoints = (): Promise<DemoEndpoints> => {
  endpointsPromise ??= loadEndpoints().catch((error: unknown) => {
    endpointsPromise = null;
    throw error;
  });
  return endpointsPromise;
};

const registerClient = async (registrationEndpoint: string, redirectUri: string): Promise<string> => {
  const response = await fetch(registrationEndpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "AgentVault",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });
  const body = await readJson(response);
  const clientId = stringField(body, "client_id");
  if (!response.ok || !clientId) {
    throw new AppError(502, "DEMO_OAUTH_UNAVAILABLE", "The demo provider could not start authorization.");
  }
  return clientId;
};

const pendingPayload = (verifier: string, clientId: string): string =>
  encryptSecret(JSON.stringify({ verifier, clientId }));

const readPendingPayload = (ciphertext: string): { verifier: string; clientId: string } => {
  const plaintext = decryptSecret(ciphertext);
  const parsed = JSON.parse(plaintext) as { verifier?: unknown; clientId?: unknown };
  if (typeof parsed.verifier !== "string" || typeof parsed.clientId !== "string") {
    throw new AppError(400, "OAUTH_STATE_INVALID", "The demo authorization session expired. Start the connection again.");
  }
  return { verifier: parsed.verifier, clientId: parsed.clientId };
};

export const beginDemoAuthorization = async (userId: string): Promise<{ authorizationUrl: string }> => {
  const redirectUri = demoRedirectUri();
  const discovered = await endpoints();
  const clientId = await registerClient(discovered.registrationEndpoint, redirectUri);
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const db = getDatabase();
  await db.delete(oauthStates).where(and(eq(oauthStates.userId, userId), eq(oauthStates.provider, "demo")));
  await db.insert(oauthStates).values({
    userId,
    provider: "demo",
    stateHash: sha256(state),
    codeVerifierCiphertext: pendingPayload(verifier, clientId),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  const url = new URL(discovered.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("resource", discovered.resource);
  return { authorizationUrl: url.toString() };
};

const exchangeToken = async (
  tokenEndpoint: string,
  body: Record<string, string>,
): Promise<TokenResponse> => {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = (await response.json().catch(() => null)) as TokenResponse | null;
  if (!response.ok || !parsed?.access_token) {
    throw new AppError(502, "DEMO_TOKEN_EXCHANGE_FAILED", "The demo provider did not accept this authorization.");
  }
  return parsed;
};

const credentialFromToken = (
  token: TokenResponse,
  clientId: string,
  previousRefresh: string | null,
): StoredProviderCredential => ({
  accessToken: token.access_token ?? "",
  refreshToken: token.refresh_token ?? previousRefresh,
  expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
  scopes: "demo.read",
  tokenType: token.token_type ?? "bearer",
  clientId,
});

export const completeDemoAuthorization = async (
  code: string,
  state: string,
): Promise<{ userId: string; connectionId: string }> => {
  const db = getDatabase();
  const [pending] = await db
    .update(oauthStates)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthStates.stateHash, sha256(state)), eq(oauthStates.provider, "demo"), isNull(oauthStates.consumedAt)))
    .returning();
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    throw new AppError(400, "OAUTH_STATE_INVALID", "The demo authorization session expired. Start the connection again.");
  }
  const { verifier, clientId } = readPendingPayload(pending.codeVerifierCiphertext);
  const discovered = await endpoints();
  const token = await exchangeToken(discovered.tokenEndpoint, {
    grant_type: "authorization_code",
    code,
    redirect_uri: demoRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
    resource: discovered.resource,
  });
  const [definition] = await db
    .select()
    .from(connectorDefinitions)
    .where(eq(connectorDefinitions.provider, "demo"))
    .limit(1);
  if (!definition) {
    throw new AppError(500, "CONNECTOR_NOT_SEEDED", "The demo provider is not available right now.");
  }
  const [existing] = await db
    .select()
    .from(userConnections)
    .where(and(eq(userConnections.userId, pending.userId), eq(userConnections.connectorId, definition.id)))
    .limit(1);
  const values = {
    providerAccountId: "demo",
    status: "pending" as const,
    statusDetail: "Authorization succeeded. Checking the demo provider.",
    grantedCapabilities: ["demo.read"],
    readOnly: true,
    updatedAt: new Date(),
  };
  const connectionId = existing
    ? existing.id
    : (
        await db
          .insert(userConnections)
          .values({ userId: pending.userId, connectorId: definition.id, ...values })
          .returning({ id: userConnections.id })
      )[0]?.id;
  if (!connectionId) throw new AppError(500, "CONNECTION_CREATE_FAILED", "The demo connection could not be saved.");
  if (existing) {
    await db.update(userConnections).set(values).where(eq(userConnections.id, connectionId));
  }
  await saveConnectionCredential(connectionId, credentialFromToken(token, clientId, null));
  return { userId: pending.userId, connectionId };
};

export const refreshDemoCredential = async (connectionId: string): Promise<string> => {
  const { loadConnectionCredential } = await import("@/modules/connectors/services/credential-store");
  const current = await loadConnectionCredential(connectionId);
  if (!current.refreshToken || !current.clientId) {
    throw new AppError(401, "CREDENTIAL_EXPIRED", "Connect the demo provider again.");
  }
  const discovered = await endpoints();
  let token: TokenResponse;
  try {
    token = await exchangeToken(discovered.tokenEndpoint, {
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
      client_id: current.clientId,
      resource: discovered.resource,
    });
  } catch {
    throw new AppError(401, "CREDENTIAL_EXPIRED", "Connect the demo provider again.");
  }
  await saveConnectionCredential(connectionId, credentialFromToken(token, current.clientId, current.refreshToken));
  return token.access_token ?? "";
};

export const revokeDemoCredential = async (credential: StoredProviderCredential): Promise<void> => {
  if (!credential.clientId) return;
  const discovered = await endpoints();
  if (!discovered.revocationEndpoint) return;
  await fetch(discovered.revocationEndpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      token: credential.accessToken,
      token_type_hint: "access_token",
      client_id: credential.clientId,
    }),
  }).catch(() => undefined);
};
