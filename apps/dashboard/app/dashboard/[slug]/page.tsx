import { headers } from "next/headers";

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

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border bg-card p-5">
            <p className="text-[12px] text-muted-foreground">{label}</p>
            <p className="mt-2 text-[26px] leading-8 font-semibold tracking-tight tabular-nums">
                {value}
            </p>
        </div>
    );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-medium">{title}</h2>
            <span className="text-[12px] text-muted-foreground tabular-nums">
                {count}
            </span>
        </div>
    );
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
            <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
                    <p className="text-[15px] font-medium">Project not found</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        It may have been deleted, or you don&apos;t have access.
                    </p>
                </div>
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
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-8">
                <h1 className="text-[22px] font-semibold tracking-tight">
                    {projectData.project.name}
                </h1>
                <p className="mt-1 text-[13px] text-muted-foreground">
                    Overview of subscriptions, plans, and customers.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                    label="Active subscriptions"
                    value={stats.activeSubscriptions}
                />
                <Stat label="Total customers" value={stats.totalCustomers} />
                <Stat label="Plans" value={plans.length} />
            </div>

            <section className="mt-10">
                <SectionHeader title="Plans" count={plans.length} />
                {plans.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-[13px] text-muted-foreground">
                        No plans yet.
                    </div>
                ) : (
                    <div className="divide-y overflow-hidden rounded-xl border bg-card">
                        {plans.map((plan: any) => (
                            <div
                                key={plan.id}
                                className="flex items-center justify-between px-4 py-3"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-medium">
                                        {plan.name}
                                    </span>
                                    {plan.trialDays > 0 && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                            {plan.trialDays}-day trial
                                        </span>
                                    )}
                                </div>
                                <span className="text-[13px] text-muted-foreground tabular-nums">
                                    {formatMoney(plan.price, plan.currency)}
                                    <span className="text-muted-foreground/60">
                                        {" / "}
                                        {plan.billingInterval}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-10">
                <SectionHeader title="Customers" count={customers.length} />
                {customers.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-[13px] text-muted-foreground">
                        No customers yet.
                    </div>
                ) : (
                    <div className="divide-y overflow-hidden rounded-xl border bg-card">
                        {customers.map((customer: any) => (
                            <div
                                key={customer.id}
                                className="flex items-center justify-between px-4 py-3"
                            >
                                <span className="text-[13px] font-medium">
                                    {customer.name ?? customer.email}
                                </span>
                                <span className="text-[13px] text-muted-foreground">
                                    {customer.email}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
