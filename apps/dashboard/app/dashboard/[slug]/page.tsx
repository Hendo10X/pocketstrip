import Link from "next/link";
import { headers } from "next/headers";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function get<T>(path: string, cookie: string, fallback: T): Promise<T> {
    try {
        const res = await fetch(`${API}${path}`, {
            headers: { cookie },
            cache: "no-store",
        });
        if (!res.ok) return fallback;
        return (await res.json()) as T;
    } catch {
        return fallback;
    }
}

type Analytics = {
    mrr: number;
    currency: string;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    totalCustomers: number;
    newSubscriptionsThisPeriod: number;
};

type Invoice = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
    customerEmail: string;
    customerName: string | null;
};

const EMPTY_ANALYTICS: Analytics = {
    mrr: 0,
    currency: "usd",
    activeSubscriptions: 0,
    trialingSubscriptions: 0,
    totalCustomers: 0,
    newSubscriptionsThisPeriod: 0,
};

export default async function ProjectOverviewPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const cookie = (await headers()).get("cookie") ?? "";

    const projectData = await get<{ project: { id: string; name: string } } | null>(
        `/projects/by-slug/${slug}`,
        cookie,
        null,
    );

    if (!projectData) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col items-center border bg-card py-16 text-center">
                    <p className="text-[15px] font-medium">Project not found</p>
                    <p className="mt-1 font-geist text-[13px] text-muted-foreground">
                        It may have been deleted, or you don&apos;t have access.
                    </p>
                </div>
            </div>
        );
    }

    const { id: projectId, name } = projectData.project;

    const [analytics, providers, plans, apiKeys, invoices] = await Promise.all([
        get<Analytics>(`/projects/${projectId}/analytics`, cookie, EMPTY_ANALYTICS),
        get<{ providers: unknown[] }>(`/projects/${projectId}/providers`, cookie, {
            providers: [],
        }),
        get<{ plans: unknown[] }>(`/projects/${projectId}/plans`, cookie, {
            plans: [],
        }),
        get<{ apiKeys: unknown[] }>(`/projects/${projectId}/api-keys`, cookie, {
            apiKeys: [],
        }),
        get<{ invoices: Invoice[] }>(`/projects/${projectId}/invoices`, cookie, {
            invoices: [],
        }),
    ]);

    const steps = [
        {
            done: providers.providers.length > 0,
            title: "Connect a payment provider",
            body: "Add your Stripe test keys so PocketStrip can take payments.",
            href: `/dashboard/${slug}/settings`,
        },
        {
            done: plans.plans.length > 0,
            title: "Create a plan",
            body: "Set a price, billing interval, and the features it unlocks.",
            href: `/dashboard/${slug}/plans`,
        },
        {
            done: analytics.totalCustomers > 0,
            title: "Add a customer",
            body: "Create one here, or from your app with the SDK.",
            href: `/dashboard/${slug}/customers`,
        },
        {
            done:
                analytics.activeSubscriptions + analytics.trialingSubscriptions > 0,
            title: "Run a test checkout",
            body: "Pay with card 4242 4242 4242 4242 and watch it go live.",
            href: `/dashboard/${slug}/customers`,
        },
        {
            done: apiKeys.apiKeys.length > 0,
            title: "Create an API key",
            body: "Connect your own app with the SDK.",
            href: `/dashboard/${slug}/developers`,
        },
    ];
    const doneCount = steps.filter((s) => s.done).length;
    const nextStep = steps.findIndex((s) => !s.done);
    const showSetup = doneCount < steps.length;
    const latest = invoices.invoices.slice(0, 6);

    const spec = [
        ["Active", analytics.activeSubscriptions],
        ["On trial", analytics.trialingSubscriptions],
        ["Customers", analytics.totalCustomers],
        ["New this month", analytics.newSubscriptionsThisPeriod],
    ] as const;

    return (
        <div className="mx-auto w-full max-w-6xl">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                Overview
            </p>
            <h1 className="mt-2 font-display text-[40px] leading-[1.05] tracking-[-0.02em]">
                {name}
            </h1>

            {/* Revenue + spec sheet */}
            <section className="mt-10 grid border md:grid-cols-[1.4fr_1fr]">
                <div className="border-b p-6 md:border-r md:border-b-0 md:p-8">
                    <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                        Monthly recurring revenue
                    </p>
                    <p className="mt-3 font-display text-[56px] leading-none tracking-[-0.03em] tabular-nums md:text-[72px]">
                        {formatMoney(analytics.mrr, analytics.currency)}
                    </p>
                    <p className="mt-4 font-geist text-[12px] text-muted-foreground">
                        Active subscriptions, normalised to a month — yearly plans
                        count as price ÷ 12.
                    </p>
                </div>
                <dl className="divide-y">
                    {spec.map(([label, value]) => (
                        <div
                            key={label}
                            className="flex items-baseline justify-between px-6 py-4"
                        >
                            <dt className="font-geist text-[13px] text-muted-foreground">
                                {label}
                            </dt>
                            <dd className="font-display text-[26px] leading-none tabular-nums">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            <div
                className={`mt-12 grid gap-12 ${showSetup ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}
            >
                {/* Setup stepper */}
                {showSetup && (
                    <section>
                        <div className="mb-6 flex items-baseline justify-between">
                            <h2 className="font-display text-[24px] leading-none">
                                Getting started
                            </h2>
                            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                                {doneCount}/{steps.length}
                            </span>
                        </div>
                        <ol className="relative">
                            <span
                                className="absolute top-2 bottom-2 left-[5px] w-px bg-border"
                                aria-hidden
                            />
                            {steps.map((step, i) => {
                                const isNext = i === nextStep;
                                return (
                                    <li key={step.title} className="relative pb-6 pl-8 last:pb-0">
                                        <span
                                            className={`absolute top-1.5 left-0 h-[11px] w-[11px] border ${
                                                step.done
                                                    ? "border-foreground bg-foreground"
                                                    : isNext
                                                      ? "border-brand bg-brand"
                                                      : "border-border bg-background"
                                            }`}
                                            aria-hidden
                                        />
                                        <Link href={step.href} className="group block">
                                            <span
                                                className={`block text-[14px] ${
                                                    step.done
                                                        ? "text-muted-foreground line-through"
                                                        : isNext
                                                          ? "font-medium text-foreground"
                                                          : "text-foreground/70"
                                                }`}
                                            >
                                                {step.title}
                                                {isNext && (
                                                    <span className="ml-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase transition-colors group-hover:text-foreground">
                                                        Next →
                                                    </span>
                                                )}
                                            </span>
                                            {!step.done && (
                                                <span className="mt-0.5 block font-geist text-[12px] text-muted-foreground">
                                                    {step.body}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                )}

                {/* Latest payments */}
                <section>
                    <div className="mb-6 flex items-baseline justify-between">
                        <h2 className="font-display text-[24px] leading-none">
                            Latest payments
                        </h2>
                        <Link
                            href={`/dashboard/${slug}/payments`}
                            className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                        >
                            View all
                        </Link>
                    </div>
                    {latest.length === 0 ? (
                        <div className="border border-dashed px-6 py-12 text-center font-geist text-[13px] text-muted-foreground">
                            Payments appear here once a checkout completes.
                        </div>
                    ) : (
                        <div className="divide-y border">
                            {latest.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-medium">
                                            {invoice.customerName ?? invoice.customerEmail}
                                        </p>
                                        <p className="font-geist text-[11px] text-muted-foreground">
                                            {formatDate(invoice.paidAt ?? invoice.createdAt)}
                                        </p>
                                    </div>
                                    <StatusPill status={invoice.status} />
                                    <span className="w-20 text-right text-[13px] tabular-nums">
                                        {formatMoney(invoice.amount, invoice.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
