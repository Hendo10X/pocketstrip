import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const STATUS_COLOR: Record<string, string> = {
    trialing: "text-amber-600",
    active: "text-emerald-600",
    past_due: "text-red-600",
    cancelled: "text-muted-foreground",
    expired: "text-muted-foreground",
};

export default async function PortalPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const data = await getPortalData(token);

    if ("error" in data) {
        return (
            <div className="mx-auto flex min-h-screen max-w-120 flex-col items-center justify-center px-6 text-center">
                <h1 className="text-[18px] font-medium leading-7">
                    This link isn&apos;t valid
                </h1>
                <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                    {data.error}
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto min-h-screen max-w-120 px-6 py-16">
            <h1 className="text-[24px] font-medium leading-8">
                Your subscription
            </h1>
            <p className="mt-1 text-[13px] leading-5.5  text-muted-foreground">
                {data.customer.email}
            </p>

            <div className="mt-8">
                {data.subscriptions.length === 0 ? (
                    <Card className="rounded-[10px] border p-5 text-center">
                        <p className="text-[15px] font-medium leading-6">
                            No subscriptions yet
                        </p>
                        <p className="mt-1 text-[13px] leading-5.5  text-muted-foreground">
                            You don&apos;t have any active subscriptions on this
                            account.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {data.subscriptions.map((sub) => (
                            <Card
                                key={sub.id}
                                className="rounded-[10px] border p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[15px] font-medium leading-6">
                                        {sub.planName}
                                    </span>
                                    <span
                                        className={`text-[12px] font-medium leading-5 ${STATUS_COLOR[sub.status] ?? ""}`}
                                    >
                                        {STATUS_LABEL[sub.status] ?? sub.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-[13px] leading-5.5 text-muted-foreground">
                                    {formatMoney(sub.price, sub.currency)} /{" "}
                                    {sub.billingInterval}
                                </p>
                                <p className="mt-3 text-[12px] leading-5 text-muted-foreground">
                                    {sub.cancelAt
                                        ? `Cancels on ${new Date(sub.cancelAt).toLocaleDateString()}`
                                        : `Renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
