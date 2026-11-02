const LABELS: Record<string, string> = {
    active: "Active",
    trialing: "On trial",
    past_due: "Past due",
    cancelled: "Cancelled",
    paid: "Paid",
    failed: "Failed",
};

const STYLES: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    trialing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    past_due: "bg-destructive/10 text-destructive",
    failed: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
};

export function StatusPill({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                STYLES[status] ?? "bg-muted text-muted-foreground"
            }`}
        >
            {LABELS[status] ?? status}
        </span>
    );
}
