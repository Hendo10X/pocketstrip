import Link from "next/link";
import { headers } from "next/headers";
import { formatMoney } from "@/lib/format";

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

const EMPTY_ANALYTICS: Analytics = {
    mrr: 0,
    currency: "usd",
    activeSubscriptions: 0,
    trialingSubscriptions: 0,
    totalCustomers: 0,
    newSubscriptionsThisPeriod: 0,
};

function Stat({
    label,
    value,
    hint,
}: {
    label: string;
    value: string | number;
    hint?: string;
}) {
    return (
        <div className="rounded-2xl bg-card p-5">
            <p className="font-geist text-[12px] text-muted-foreground">{label}</p>
            <p className="mt-2 text-[26px] leading-8 font-semibold tracking-tight tabular-nums">
                {value}
            </p>
            {hint && (
                <p className="mt-1 font-geist text-[12px] text-muted-foreground">
                    {hint}
                </p>
            )}
        </div>
    );
}

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
            <div className="mx-auto w-full max-w-5xl">
                <div className="flex flex-col items-center rounded-2xl bg-card py-16 text-center">
                    <p className="text-[15px] font-medium">Project not found</p>
                    <p className="mt-1 font-geist text-[13px] text-muted-foreground">
                        It may have been deleted, or you don&apos;t have access.
                    </p>
                </div>
            </div>
        );
    }

    const { id: projectId, name } = projectData.project;

    const [analytics, providers, plans, apiKeys] = await Promise.all([
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
            body: "Pay with card 4242 4242 4242 4242 and watch the subscription go live.",
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

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-8">
                <h1 className="text-[22px] font-semibold tracking-tight">{name}</h1>
                <p className="mt-1 font-geist text-[13px] text-muted-foreground">
                    Revenue, subscriptions, and setup at a glance.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                    label="Monthly recurring revenue"
                    value={formatMoney(analytics.mrr, analytics.currency)}
                    hint="Yearly plans counted as price ÷ 12"
                />
                <Stat
                    label="Active subscriptions"
                    value={analytics.activeSubscriptions}
                    hint={
                        analytics.trialingSubscriptions > 0
                            ? `+ ${analytics.trialingSubscriptions} on trial`
                            : `${analytics.newSubscriptionsThisPeriod} new this month`
                    }
                />
                <Stat label="Customers" value={analytics.totalCustomers} />
            </div>

            {doneCount < steps.length && (
                <section className="mt-10">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-[15px] font-medium">Getting started</h2>
                        <span className="font-geist text-[12px] text-muted-foreground tabular-nums">
                            {doneCount} of {steps.length} done
                        </span>
                    </div>
                    <div className="divide-y overflow-hidden rounded-2xl bg-card">
                        {steps.map((step, i) => (
                            <Link
                                key={step.title}
                                href={step.href}
                                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                            >
                                <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                        step.done
                                            ? "bg-foreground text-background"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {step.done ? "✓" : i + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={`block text-[13px] font-medium ${
                                            step.done
                                                ? "text-muted-foreground line-through"
                                                : ""
                                        }`}
                                    >
                                        {step.title}
                                    </span>
                                    <span className="block font-geist text-[12px] text-muted-foreground">
                                        {step.body}
                                    </span>
                                </span>
                                {!step.done && (
                                    <span className="text-[12px] text-muted-foreground">
                                        →
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
