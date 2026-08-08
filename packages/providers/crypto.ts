import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const MASTER_KEY_ENV = process.env.PROVIDERS_MASTER_KEY ?? "";

function getKey(): Buffer {
    // Derive 32-byte key from master env var using SHA-256.
    return createHash("sha256").update(MASTER_KEY_ENV).digest();
}

// Format: base64(iv) + "." + base64(tag) + "." + base64(ciphertext)
export function encryptSecret(plaintext: string): string {
    if (!MASTER_KEY_ENV) {
        throw new Error("PROVIDERS_MASTER_KEY is not set");
    }

    const iv = randomBytes(12);
    const key = getKey();
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
    if (!MASTER_KEY_ENV) {
        throw new Error("PROVIDERS_MASTER_KEY is not set");
    }

    const [ivB64, tagB64, cipherB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !cipherB64) {
        throw new Error("Invalid encrypted payload format");
    }

    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ciphertext = Buffer.from(cipherB64, "base64");
    const key = getKey();

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
}

export const cryptoAvailable = !!MASTER_KEY_ENV;

export default { encryptSecret, decryptSecret, cryptoAvailable };
