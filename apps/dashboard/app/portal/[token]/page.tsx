type PortalData = {
    customer: { email: string; name: string | null };
    subscriptions: {
        id: string;
        status: string;
        currentPeriodEnd: string;
        cancelAt: string | null;
        planName: string;
        price: number;
        currency: string;
        billingInterval: string;
    }[];
};

async function getPortalData(
    token: string,
): Promise<PortalData | { error: string }> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/portal/${token}`,
        {
            cache: "no-store",
        },
    );
    return res.json();
}

function formatMoney(amountInMinorUnits: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(amountInMinorUnits / 100);
}

const STATUS_LABEL: Record<string, string> = {
    trialing: "On trial",
    active: "Active",
    past_due: "Payment past due",
    cancelled: "Cancelled",
    expired: "Expired",
};

const STATUS_STYLE: Record<string, string> = {
    trialing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    active: "bg-brand/20 text-foreground",
    past_due: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    expired: "bg-muted text-muted-foreground",
};

function StatusPill({ status }: { status: string }) {
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                STATUS_STYLE[status] ?? "bg-muted text-muted-foreground"
            }`}
        >
            {STATUS_LABEL[status] ?? status}
        </span>
    );
}

export default async function PortalPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const data = await getPortalData(token);

    if ("error" in data) {
        return (
            <div className="mx-auto flex min-h-screen max-w-100 flex-col items-center justify-center px-6 text-center">
                <h1 className="text-[18px] font-semibold">
                    This link isn&apos;t valid
                </h1>
                <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                    {data.error}
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto min-h-screen max-w-108 px-6 py-16">
            <div className="mb-10 flex items-center justify-between">
                <span className="text-[13px] font-semibold tracking-tight">
                    PocketStrip
                </span>
                <span className="text-[12px] text-muted-foreground">
                    Billing portal
                </span>
            </div>

            <h1 className="text-[22px] font-semibold tracking-tight">
                Your subscription
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
                {data.customer.email}
            </p>

            <div className="mt-8">
                {data.subscriptions.length === 0 ? (
                    <div className="rounded-xl bg-muted/40 p-8 text-center">
                        <p className="text-[15px] font-medium">
                            No subscriptions yet
                        </p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                            You don&apos;t have any active subscriptions on this
                            account.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.subscriptions.map((sub) => (
                            <div
                                key={sub.id}
                                className="rounded-xl bg-card p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[15px] font-medium">
                                        {sub.planName}
                                    </span>
                                    <StatusPill status={sub.status} />
                                </div>
                                <p className="mt-1 text-[13px] text-muted-foreground tabular-nums">
                                    {formatMoney(sub.price, sub.currency)}
                                    <span className="text-muted-foreground/60">
                                        {" / "}
                                        {sub.billingInterval}
                                    </span>
                                </p>
                                <p className="mt-4 border-t pt-3 text-[12px] text-muted-foreground">
                                    {sub.cancelAt
                                        ? `Cancels on ${new Date(sub.cancelAt).toLocaleDateString()}`
                                        : `Renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
