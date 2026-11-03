import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { capabilityIds, type CapabilityId } from "@agentvault/shared";

import { getDatabase } from "@/db/client";
import { connectorDefinitions, oauthStates, userConnections } from "@/db/schema";
import { env } from "@/lib/config/env";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
import { sha256 } from "@/lib/crypto/sha256";
import { AppError } from "@/lib/errors/app-error";
import { saveConnectionCredential, type StoredProviderCredential } from "@/modules/connectors/services/credential-store";

const githubAuthorizeUrl = "https://github.com/login/oauth/authorize";
const githubTokenUrl = "https://github.com/login/oauth/access_token";
const githubUserUrl = "https://api.github.com/user";
const scopes = "repo read:user user:email";

export const githubOauthConfigured = (): boolean =>
  Boolean(env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET);

export const githubRedirectUri = (): string =>
  env.GITHUB_OAUTH_REDIRECT_URI ?? `${env.API_PUBLIC_URL.replace(/\/$/, "")}/api/oauth/github/callback`;

const requireOauthConfig = (): { clientId: string; clientSecret: string } => {
  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    throw new AppError(
      503,
      "GITHUB_OAUTH_NOT_CONFIGURED",
      "GitHub authorization is not set up on this AgentVault server yet.",
    );
  }
  return { clientId: env.GITHUB_OAUTH_CLIENT_ID, clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET };
};

const capabilitiesFromScopes = (scope: string): CapabilityId[] => {
  const granted = new Set(scope.split(/[,\s]+/).filter(Boolean));
  if (granted.has("repo") || granted.has("public_repo")) {
    return capabilityIds.filter((capability) => capability.startsWith("github."));
  }
  return [];
};

export const beginGithubAuthorization = async (userId: string): Promise<{ authorizationUrl: string }> => {
  const { clientId } = requireOauthConfig();
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const db = getDatabase();
  await db.delete(oauthStates).where(and(eq(oauthStates.userId, userId), eq(oauthStates.provider, "github")));
  await db.insert(oauthStates).values({
    userId,
    provider: "github",
    stateHash: sha256(state),
    codeVerifierCiphertext: encryptSecret(verifier),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  const url = new URL(githubAuthorizeUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", githubRedirectUri());
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("allow_signup", "false");
  return { authorizationUrl: url.toString() };
};

interface GithubTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
}

const exchangeCode = async (code: string, verifier: string): Promise<GithubTokenResponse> => {
  const { clientId, clientSecret } = requireOauthConfig();
  const response = await fetch(githubTokenUrl, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: githubRedirectUri(),
      code_verifier: verifier,
    }),
  });
  const body = (await response.json().catch(() => null)) as GithubTokenResponse | null;
  if (!response.ok || !body?.access_token) {
    throw new AppError(502, "GITHUB_TOKEN_EXCHANGE_FAILED", "GitHub did not accept the authorization code.");
  }
  return body;
};

const githubLogin = async (accessToken: string): Promise<string> => {
  const response = await fetch(githubUserUrl, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${accessToken}`,
      "user-agent": "agentvault",
    },
  });
  const body = (await response.json().catch(() => null)) as { login?: string } | null;
  if (!response.ok || !body?.login) {
    throw new AppError(502, "GITHUB_IDENTITY_FAILED", "GitHub did not confirm the authorized account.");
  }
  return body.login;
};

export const completeGithubAuthorization = async (
  code: string,
  state: string,
): Promise<{ userId: string; connectionId: string }> => {
  const db = getDatabase();
  const [pending] = await db
    .update(oauthStates)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthStates.stateHash, sha256(state)), eq(oauthStates.provider, "github"), isNull(oauthStates.consumedAt)))
    .returning();
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    throw new AppError(400, "OAUTH_STATE_INVALID", "The GitHub authorization session expired. Start the connection again.");
  }
  const verifier = decryptSecret(pending.codeVerifierCiphertext);
  const token = await exchangeCode(code, verifier);
  const login = await githubLogin(token.access_token ?? "");
  const granted = capabilitiesFromScopes(token.scope ?? "");
  if (granted.length === 0) {
    throw new AppError(403, "GITHUB_SCOPE_MISSING", "GitHub did not grant repository access for this authorization.");
  }
  const [definition] = await db
    .select()
    .from(connectorDefinitions)
    .where(eq(connectorDefinitions.provider, "github"))
    .limit(1);
  if (!definition) {
    throw new AppError(500, "CONNECTOR_NOT_SEEDED", "The GitHub connector is not in the database.");
  }
  const credential: StoredProviderCredential = {
    accessToken: token.access_token ?? "",
    refreshToken: token.refresh_token ?? null,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
    scopes: token.scope ?? "",
    tokenType: token.token_type ?? "bearer",
  };
  const [existing] = await db
    .select()
    .from(userConnections)
    .where(and(eq(userConnections.userId, pending.userId), eq(userConnections.connectorId, definition.id)))
    .limit(1);
  const values = {
    providerAccountId: login,
    status: "pending" as const,
    statusDetail: "GitHub authorization succeeded. Checking the remote MCP server.",
    grantedCapabilities: granted,
    readOnly: false,
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
  if (!connectionId) throw new AppError(500, "CONNECTION_CREATE_FAILED", "The GitHub connection could not be saved.");
  if (existing) {
    await db.update(userConnections).set(values).where(eq(userConnections.id, connectionId));
  }
  await saveConnectionCredential(connectionId, credential);
  return { userId: pending.userId, connectionId };
};

export const refreshGithubCredential = async (connectionId: string): Promise<string> => {
  const { loadConnectionCredential } = await import("@/modules/connectors/services/credential-store");
  const current = await loadConnectionCredential(connectionId);
  if (!current.refreshToken) {
    throw new AppError(401, "CREDENTIAL_EXPIRED", "The GitHub credential expired and cannot be refreshed.");
  }
  const { clientId, clientSecret } = requireOauthConfig();
  const response = await fetch(githubTokenUrl, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
    }),
  });
  const body = (await response.json().catch(() => null)) as GithubTokenResponse | null;
  if (!response.ok || !body?.access_token) {
    throw new AppError(401, "CREDENTIAL_EXPIRED", "GitHub refused to refresh this connection.");
  }
  await saveConnectionCredential(connectionId, {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? current.refreshToken,
    expiresAt: body.expires_in ? new Date(Date.now() + body.expires_in * 1000).toISOString() : null,
    scopes: body.scope ?? current.scopes,
    tokenType: body.token_type ?? current.tokenType,
  });
  return body.access_token;
};

export const revokeGithubCredential = async (accessToken: string): Promise<void> => {
  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) return;
  const authorization = Buffer.from(`${env.GITHUB_OAUTH_CLIENT_ID}:${env.GITHUB_OAUTH_CLIENT_SECRET}`).toString("base64");
  await fetch(`https://api.github.com/applications/${env.GITHUB_OAUTH_CLIENT_ID}/token`, {
    method: "DELETE",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Basic ${authorization}`,
      "content-type": "application/json",
      "user-agent": "agentvault",
    },
    body: JSON.stringify({ access_token: accessToken }),
  }).catch(() => undefined);
};
