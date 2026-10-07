import { timingSafeEqual } from "crypto";

// Constant-time comparison for secrets (e.g. hashed API keys). A plain `!==`
// leaks timing information that can be used to recover a value byte by byte.
export function safeEqualHex(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
