import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const MASTER_KEY_ENV = process.env.PROVIDERS_MASTER_KEY ?? "";

// Require a high-entropy master key. We derive the AES key with SHA-256 (fine
// for a strong, random secret), so we reject short/guessable passphrases rather
// than silently stretching a weak one. Generate with: openssl rand -base64 32
const MIN_MASTER_KEY_LENGTH = 32;

function assertMasterKey(): void {
    if (!MASTER_KEY_ENV) {
        throw new Error("PROVIDERS_MASTER_KEY is not set");
    }
    if (MASTER_KEY_ENV.length < MIN_MASTER_KEY_LENGTH) {
        throw new Error(
            `PROVIDERS_MASTER_KEY must be at least ${MIN_MASTER_KEY_LENGTH} characters of high-entropy randomness (e.g. \`openssl rand -base64 32\`)`,
        );
    }
}

function getKey(): Buffer {
    // Derive a 32-byte key from the master secret using SHA-256.
    return createHash("sha256").update(MASTER_KEY_ENV).digest();
}

// Format: base64(iv) + "." + base64(tag) + "." + base64(ciphertext)
export function encryptSecret(plaintext: string): string {
    assertMasterKey();

    const iv = randomBytes(12);
    const key = getKey();
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
    assertMasterKey();

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
