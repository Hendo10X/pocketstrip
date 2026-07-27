import { headers } from "next/headers";
import { Card } from "@/components/ui/card";

async function getProjectBySlug(slug: string, cookie: string) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/by-slug/${slug}`,
        {
            headers: { cookie },
            cache: "no-store",
        },
    );
    if (!res.ok) return null;
    return res.json();
}

async function getStats(projectId: string, cookie: string) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/stats`,
        {
            headers: { cookie },
            cache: "no-store",
        },
    );
    if (!res.ok) return { activeSubscriptions: 0, totalCustomers: 0 };
    return res.json();
}

async function getPlans(projectId: string, cookie: string) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/plans`,
        {
            headers: { cookie },
            cache: "no-store",
        },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.plans;
}

async function getCustomers(projectId: string, cookie: string) {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/customers`,
        {
            headers: { cookie },
            cache: "no-store",
        },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.customers;
}

function formatMoney(amountInMinorUnits: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    }).format(amountInMinorUnits / 100);
}

export default async function ProjectDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const headersList = await headers();
    const cookie = headersList.get("cookie") ?? "";

    const projectData = await getProjectBySlug(slug, cookie);

    if (!projectData) {
        return (
            <div className="max-w-[1600px] text-center">
                <p className="text-[13px] text-muted-foreground">
                    Project not found.
                </p>
            </div>
        );
    }

    const projectId = projectData.project.id;

    const [stats, plans, customers] = await Promise.all([
        getStats(projectId, cookie),
        getPlans(projectId, cookie),
        getCustomers(projectId, cookie),
    ]);

    return (
        <div className="max-w-[1600px]">
            <h1 className="text-[24px] font-medium leading-8">
                {projectData.project.name}
            </h1>
            <p className="mt-1 text-[13px] leading-5.5 text-muted-foreground">
                {projectData.project.slug}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-6">
                <Card className="rounded-[10px] border border-neutral-200 p-5 dark:border-neutral-800">
                    <p className="text-[12px] leading-5 text-muted-foreground">
                        Active subscriptions
                    </p>
                    <p className="mt-1 text-[24px] font-medium leading-8">
                        {stats.activeSubscriptions}
                    </p>
                </Card>
                <Card className="rounded-[10px] border border-neutral-200 p-5 dark:border-neutral-800">
                    <p className="text-[12px] leading-5 text-muted-foreground">
                        Total customers
                    </p>
                    <p className="mt-1 text-[24px] font-medium leading-8">
                        {stats.totalCustomers}
                    </p>
                </Card>
            </div>

            <div className="mt-10">
                <h2 className="text-[18px] font-medium leading-7">Plans</h2>
                {plans.length === 0 ? (
                    <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                        No plans yet.
                    </p>
                ) : (
                    <div className="mt-3 space-y-2">
                        {plans.map((plan: any) => (
                            <Card
                                key={plan.id}
                                className="rounded-[10px] border border-neutral-200 p-4 dark:border-neutral-800"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium">
                                        {plan.name}
                                    </span>
                                    <span className="text-[13px] text-muted-foreground">
                                        {formatMoney(plan.price, plan.currency)}{" "}
                                        / {plan.billingInterval}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-10">
                <h2 className="text-[18px] font-medium leading-7">Customers</h2>
                {customers.length === 0 ? (
                    <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                        No customers yet.
                    </p>
                ) : (
                    <div className="mt-3 space-y-2">
                        {customers.map((customer: any) => (
                            <Card
                                key={customer.id}
                                className="rounded-[10px] border border-neutral-200 p-4 dark:border-neutral-800"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium">
                                        {customer.name ?? customer.email}
                                    </span>
                                    <span className="text-[13px] text-muted-foreground">
                                        {customer.email}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
