import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const keyLength = 32;

export interface PasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, passwordHash: string): Promise<boolean>;
}

const derive = async (plaintext: string, salt: string): Promise<Buffer> => {
  const derived = await scryptAsync(plaintext, salt, keyLength);
  if (!Buffer.isBuffer(derived)) {
    throw new Error("Password hashing failed.");
  }
  return derived;
};

export const passwordHasher: PasswordHasher = {
  hash: async (plaintext) => {
    const salt = randomBytes(16).toString("hex");
    const derived = await derive(plaintext, salt);
    return `scrypt:${salt}:${derived.toString("hex")}`;
  },
  verify: async (plaintext, passwordHash) => {
    const [scheme, salt, hash] = passwordHash.split(":");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const derived = await derive(plaintext, salt);
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(expected, derived);
  },
};
