import { Card } from "@/components/ui/card";

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

function statusLabel(status: string) {
    const labels: Record<string, string> = {
        trialing: "On trial",
        active: "Active",
        past_due: "Payment past due",
        cancelled: "Cancelled",
        expired: "Expired",
    };
    return labels[status] ?? status;
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
            <div className="mx-auto max-w-md p-8 text-center">
                <h1 className="text-lg font-medium mb-2">
                    This link isn&apos;t valid
                </h1>
                <p className="text-sm text-muted-foreground">{data.error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md p-8">
            <h1 className="text-lg font-medium mb-1">Your subscription</h1>
            <p className="text-sm text-muted-foreground mb-6">
                {data.customer.email}
            </p>

            {data.subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No active subscriptions.
                </p>
            ) : (
                <div className="space-y-3">
                    {data.subscriptions.map((sub) => (
                        <Card key={sub.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                    {sub.planName}
                                </span>
                                <span className="text-xs uppercase text-muted-foreground">
                                    {statusLabel(sub.status)}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {formatMoney(sub.price, sub.currency)} /{" "}
                                {sub.billingInterval}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {sub.cancelAt
                                    ? `Cancels on ${new Date(sub.cancelAt).toLocaleDateString()}`
                                    : `Renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                            </p>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
