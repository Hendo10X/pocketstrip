const LABELS: Record<string, string> = {
    active: "Active",
    trialing: "On trial",
    past_due: "Past due",
    cancelled: "Cancelled",
    paid: "Paid",
    failed: "Failed",
};

const DOT: Record<string, string> = {
    active: "bg-emerald-500",
    paid: "bg-emerald-500",
    trialing: "bg-amber-500",
    past_due: "bg-red-500",
    failed: "bg-red-500",
    cancelled: "bg-muted-foreground/50",
};

// Midday-style status: a small square marker and plain text, no capsule.
export function StatusPill({ status }: { status: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/90">
            <span
                className={`h-1.5 w-1.5 shrink-0 ${DOT[status] ?? "bg-muted-foreground/50"}`}
                aria-hidden
            />
            {LABELS[status] ?? status}
        </span>
    );
}
