import { describe, it, expect } from "bun:test";
import { computeNextPeriodEnd } from "./billing";

const d = (iso: string) => new Date(`${iso}T12:00:00`);
const ymd = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

describe("computeNextPeriodEnd", () => {
    it("adds one month", () => {
        expect(ymd(computeNextPeriodEnd(d("2026-03-15"), "month"))).toBe(
            "2026-04-15",
        );
    });

    it("clamps to the end of a shorter month instead of overflowing", () => {
        expect(ymd(computeNextPeriodEnd(d("2026-01-31"), "month"))).toBe(
            "2026-02-28",
        );
        expect(ymd(computeNextPeriodEnd(d("2028-01-31"), "month"))).toBe(
            "2028-02-29",
        );
    });

    it("rolls over the year", () => {
        expect(ymd(computeNextPeriodEnd(d("2026-12-10"), "month"))).toBe(
            "2027-01-10",
        );
    });

    it("adds one year, clamping Feb 29", () => {
        expect(ymd(computeNextPeriodEnd(d("2026-06-01"), "year"))).toBe(
            "2027-06-01",
        );
        expect(ymd(computeNextPeriodEnd(d("2028-02-29"), "year"))).toBe(
            "2029-02-28",
        );
    });

    it("does not mutate the input date", () => {
        const start = d("2026-01-31");
        computeNextPeriodEnd(start, "month");
        expect(ymd(start)).toBe("2026-01-31");
    });
});
