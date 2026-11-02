import { describe, it, expect, beforeAll } from "bun:test";

// crypto.ts reads the master key when it loads, so set it before importing.
let crypto: typeof import("./crypto");

beforeAll(async () => {
    process.env.PROVIDERS_MASTER_KEY = "test-master-key-0123456789-abcdefghijklmnop";
    crypto = await import("./crypto");
});

describe("provider secret encryption", () => {
    it("round-trips a secret", () => {
        const enc = crypto.encryptSecret("sk_test_123");
        expect(enc).not.toContain("sk_test_123");
        expect(crypto.decryptSecret(enc)).toBe("sk_test_123");
    });

    it("produces a different ciphertext each time (random IV)", () => {
        expect(crypto.encryptSecret("same")).not.toBe(crypto.encryptSecret("same"));
    });

    it("rejects tampered ciphertext", () => {
        const [iv, tag, data] = crypto.encryptSecret("sk_test_123").split(".");
        const flipped = Buffer.from(data!, "base64");
        flipped[0] = flipped[0]! ^ 0xff;
        expect(() =>
            crypto.decryptSecret(`${iv}.${tag}.${flipped.toString("base64")}`),
        ).toThrow();
    });

    it("rejects malformed payloads", () => {
        expect(() => crypto.decryptSecret("not-encrypted")).toThrow(
            "Invalid encrypted payload format",
        );
    });
});
