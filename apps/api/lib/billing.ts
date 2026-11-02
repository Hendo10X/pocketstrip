// Adds one billing interval to a date. Month math is clamped to the last day of
// the target month, so a Jan 31 subscription renews on Feb 28/29 — plain
// Date#setMonth would overflow to early March.
export function computeNextPeriodEnd(from: Date, interval: string): Date {
    const next = new Date(from);
    const day = next.getDate();
    const monthsToAdd = interval === "year" ? 12 : interval === "month" ? 1 : 0;

    if (monthsToAdd === 0) return next;

    next.setDate(1);
    next.setMonth(next.getMonth() + monthsToAdd);
    const lastDayOfTargetMonth = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
    ).getDate();
    next.setDate(Math.min(day, lastDayOfTargetMonth));
    return next;
}
