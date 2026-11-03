import { createHash, randomBytes } from "node:crypto";

export const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

export const issueAgentToken = (): { token: string; tokenHash: string; tokenPrefix: string } => {
  const token = `avmcp_${randomBytes(32).toString("base64url")}`;
  return { token, tokenHash: sha256(token), tokenPrefix: token.slice(0, 12) };
};
