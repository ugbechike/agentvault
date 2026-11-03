import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";

const key = (): Buffer => {
  const secret = env.CREDENTIAL_ENCRYPTION_KEY ?? env.JWT_SECRET;
  if (!secret) {
    throw new AppError(503, "ENCRYPTION_KEY_MISSING", "Set CREDENTIAL_ENCRYPTION_KEY or JWT_SECRET before storing credentials.");
  }
  return scryptSync(secret, "agentvault-credential-v1", 32);
};

export const encryptSecret = (plaintext: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
};

export const decryptSecret = (payload: string): string => {
  const [version, ivText, tagText, dataText] = payload.split(":");
  if (version !== "v1" || !ivText || !tagText || !dataText) {
    throw new AppError(500, "CREDENTIAL_CORRUPT", "Stored credential could not be read.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataText, "base64url")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
};
