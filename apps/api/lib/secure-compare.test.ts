import { describe, it, expect } from "bun:test";
import { safeEqualHex } from "./secure-compare";

describe("safeEqualHex", () => {
    it("matches identical values", () => {
        expect(safeEqualHex("abc123", "abc123")).toBe(true);
    });

    it("rejects different values of the same length", () => {
        expect(safeEqualHex("abc123", "abc124")).toBe(false);
    });

    it("rejects different lengths without throwing", () => {
        expect(safeEqualHex("abc", "abc123")).toBe(false);
    });
});
