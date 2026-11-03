import { eq } from "drizzle-orm";

import { connectionSecrets, userConnections } from "@/db/schema";
import { getDatabase } from "@/db/client";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
import { AppError } from "@/lib/errors/app-error";

export interface StoredProviderCredential {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string;
  tokenType: string;
}

const parsePayload = (plaintext: string): StoredProviderCredential => {
  const value = JSON.parse(plaintext) as Partial<StoredProviderCredential>;
  if (!value.accessToken || typeof value.accessToken !== "string") {
    throw new AppError(500, "CREDENTIAL_CORRUPT", "Stored credential could not be read.");
  }
  return {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken ?? null,
    expiresAt: value.expiresAt ?? null,
    scopes: value.scopes ?? "",
    tokenType: value.tokenType ?? "bearer",
  };
};

export const saveConnectionCredential = async (
  connectionId: string,
  credential: StoredProviderCredential,
): Promise<string> => {
  const db = getDatabase();
  const ciphertext = encryptSecret(JSON.stringify(credential));
  const [existing] = await db
    .select({ id: connectionSecrets.id })
    .from(connectionSecrets)
    .where(eq(connectionSecrets.connectionId, connectionId))
    .limit(1);

  if (existing) {
    await db
      .update(connectionSecrets)
      .set({ ciphertext, updatedAt: new Date() })
      .where(eq(connectionSecrets.id, existing.id));
    await db
      .update(userConnections)
      .set({ encryptedCredentialReference: existing.id, updatedAt: new Date() })
      .where(eq(userConnections.id, connectionId));
    return existing.id;
  }

  const [created] = await db
    .insert(connectionSecrets)
    .values({ connectionId, ciphertext })
    .returning({ id: connectionSecrets.id });
  if (!created) {
    throw new AppError(500, "CREDENTIAL_STORE_FAILED", "The provider credential could not be stored.");
  }
  await db
    .update(userConnections)
    .set({ encryptedCredentialReference: created.id, updatedAt: new Date() })
    .where(eq(userConnections.id, connectionId));
  return created.id;
};

export const loadConnectionCredential = async (connectionId: string): Promise<StoredProviderCredential> => {
  const [row] = await getDatabase()
    .select({ ciphertext: connectionSecrets.ciphertext })
    .from(connectionSecrets)
    .where(eq(connectionSecrets.connectionId, connectionId))
    .limit(1);
  if (!row) {
    throw new AppError(401, "CREDENTIAL_MISSING", "This connection has no stored provider credential.");
  }
  return parsePayload(decryptSecret(row.ciphertext));
};

export const deleteConnectionCredential = async (connectionId: string): Promise<StoredProviderCredential | null> => {
  const db = getDatabase();
  const [row] = await db
    .select({ id: connectionSecrets.id, ciphertext: connectionSecrets.ciphertext })
    .from(connectionSecrets)
    .where(eq(connectionSecrets.connectionId, connectionId))
    .limit(1);
  if (!row) return null;
  const credential = parsePayload(decryptSecret(row.ciphertext));
  await db.delete(connectionSecrets).where(eq(connectionSecrets.id, row.id));
  return credential;
};
