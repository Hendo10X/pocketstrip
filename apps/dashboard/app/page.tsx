import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowRight01Icon,
    CreditCardIcon,
    FlashIcon,
    Invoice01Icon,
    LockIcon,
    RepeatIcon,
    WebhookIcon,
} from "@hugeicons/core-free-icons";
import { buttonVariants } from "@/components/ui/button";
import { ProviderHub } from "@/components/provider-hub";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const SPEC = [
    ["4", "concepts to learn"],
    ["1", "SDK to install"],
    ["2", "providers live"],
    ["0", "webhooks to hand-wire"],
];

const NOUNS = [
    {
        noun: "Plans",
        body: "What you sell — a price, an interval, an optional trial, and the features it unlocks.",
        code: "POST /projects/:id/plans",
    },
    {
        noun: "Customers",
        body: "The people paying you. Create them from your app or the dashboard.",
        code: "pocket.customers.create()",
    },
    {
        noun: "Subscriptions",
        body: "Created, renewed, failed and cancelled for you from verified, de-duplicated provider webhooks.",
        code: "POST /webhooks/stripe",
    },
    {
        noun: "Entitlements",
        body: "Ask whether a customer can use a feature. Billing and permissions, one call.",
        code: "pocket.access(id, feature)",
    },
];

const FEATURES = [
    {
        icon: RepeatIcon,
        title: "Renewals handled",
        body: "Period ends roll forward correctly — even Jan 31 to Feb 28.",
    },
    {
        icon: WebhookIcon,
        title: "Idempotent webhooks",
        body: "Retried deliveries are logged once and never double-charge your records.",
    },
    {
        icon: LockIcon,
        title: "Keys encrypted",
        body: "Provider secrets are verified, then stored with AES-256-GCM.",
    },
    {
        icon: Invoice01Icon,
        title: "Payment history",
        body: "Every charge and failure becomes an invoice you can show customers.",
    },
    {
        icon: CreditCardIcon,
        title: "Customer portal",
        body: "Single-use, 15-minute links. No passwords for your customers.",
    },
    {
        icon: FlashIcon,
        title: "MRR on day one",
        body: "Revenue, trials and new subscriptions without a BI tool.",
    },
];

function DashboardPreview() {
    const rows = [
        ["Ada Lovelace", "Pro", "active", "$29.00"],
        ["Grace Hopper", "Team", "trialing", "$99.00"],
        ["Alan Turing", "Pro", "active", "$29.00"],
        ["Katherine J.", "Starter", "past_due", "$9.00"],
    ];
    const pill: Record<string, string> = {
        active: "text-emerald-500",
        trialing: "text-amber-500",
        past_due: "text-red-400",
    };

    return (
        <div className="overflow-hidden border bg-card">
            <div className="flex h-9 items-center justify-between border-b px-4">
                <span className="font-mono text-[10px] text-muted-foreground">
                    app.pocketstrip.dev/dashboard/acme
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                    test mode
                </span>
            </div>
            <div className="grid grid-cols-[180px_1fr] max-md:grid-cols-1">
                <aside className="border-r p-3 max-md:hidden">
                    <div className="mb-4 flex items-center gap-2 px-1">
                        <span className="flex h-5 w-5 items-center justify-center bg-brand font-display text-[12px] text-brand-foreground">
                            P
                        </span>
                        <span className="text-[12px] font-medium">Acme Inc.</span>
                    </div>
                    {["Overview", "Plans", "Customers", "Payments", "Developers", "Settings"].map(
                        (item, i) => (
                            <div
                                key={item}
                                className={cn(
                                    "relative px-2 py-1.5 text-[12px]",
                                    i === 0
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground",
                                )}
                            >
                                {i === 0 && (
                                    <span className="absolute inset-y-0 left-0 w-0.5 bg-foreground" />
                                )}
                                {item}
                            </div>
                        ),
                    )}
                </aside>
                <div className="p-5">
                    <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                        Monthly recurring revenue
                    </p>
                    <p className="mt-1 font-display text-[44px] leading-none tracking-[-0.02em]">
                        $12,480
                    </p>
                    <div className="mt-5 grid grid-cols-3 divide-x border">
                        {[
                            ["Active", "418"],
                            ["On trial", "37"],
                            ["New this month", "+52"],
                        ].map(([label, value]) => (
                            <div key={label} className="px-3 py-2.5">
                                <p className="font-geist text-[10px] text-muted-foreground">
                                    {label}
                                </p>
                                <p className="text-[15px] font-medium tabular-nums">{value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 border">
                        {rows.map(([name, plan, status, amount]) => (
                            <div
                                key={name}
                                className="grid grid-cols-[1.4fr_0.8fr_0.9fr_0.7fr] border-b px-3 py-2 text-[11px] last:border-0"
                            >
                                <span className="font-medium">{name}</span>
                                <span className="text-muted-foreground">{plan}</span>
                                <span className={pill[status!]}>{status!.replace("_", " ")}</span>
                                <span className="text-right tabular-nums">{amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CodePanel() {
    return (
        <div className="overflow-hidden border bg-card">
            <div className="flex h-9 items-center gap-4 border-b px-4 font-mono text-[11px]">
                <span className="text-foreground">billing.ts</span>
                <span className="text-muted-foreground">TypeScript</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-6">
                <code>
                    <span className="text-muted-foreground">{"import { Pocket } from \"@pocketstrip/sdk\";\n\n"}</span>
                    {"const pocket = new Pocket({ apiKey });\n\n"}
                    <span className="text-muted-foreground">{"// Send them to checkout\n"}</span>
                    {"const { checkoutUrl } = await pocket.checkout({\n  customerId, planId,\n});\n\n"}
                    <span className="text-muted-foreground">{"// Gate a feature anywhere in your app\n"}</span>
                    {"const { hasAccess, limit } =\n  await pocket."}
                    <span className="bg-brand px-0.5 text-brand-foreground">access</span>
                    {"(customerId, \"reports\");"}
                </code>
            </pre>
        </div>
    );
}

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
                <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2 text-[15px] font-medium">
                        <span className="flex h-6 w-6 items-center justify-center bg-brand font-display text-[14px] text-brand-foreground">
                            P
                        </span>
                        PocketStrip
                    </Link>
                    <nav className="flex items-center gap-2">
                        <a
                            href="#how"
                            className="hidden px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:block"
                        >
                            How it works
                        </a>
                        <a
                            href="#developers"
                            className="hidden px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:block"
                        >
                            Developers
                        </a>
                        <ThemeToggle />
                        <Link
                            href="/sign-in"
                            className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-3 text-[13px]")}
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/sign-up"
                            className={cn(buttonVariants(), "h-8 px-3 text-[13px]")}
                        >
                            Get started
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero — left-aligned statement with a spec-sheet column */}
                <section className="mx-auto w-full max-w-6xl px-6 pt-20 pb-12 md:pt-28">
                    <div className="grid gap-12 md:grid-cols-[1fr_220px] md:items-end">
                        <div>
                            <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                Billing infrastructure for SaaS
                            </p>
                            <h1 className="mt-5 max-w-3xl font-display text-[44px] leading-[1.02] tracking-[-0.03em] sm:text-[64px] md:text-[80px]">
                                Charge for your software in an afternoon.
                            </h1>
                            <p className="mt-6 max-w-xl text-[16px] leading-7 text-muted-foreground">
                                Define plans, drop in the SDK, and PocketStrip runs
                                checkout, renewals, invoices and feature access on top
                                of the payment provider you already use.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/sign-up"
                                    className={cn(buttonVariants(), "h-11 gap-2 px-6 text-[14px]")}
                                >
                                    Start building
                                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                                </Link>
                                <a
                                    href="#developers"
                                    className={cn(
                                        buttonVariants({ variant: "outline" }),
                                        "h-11 px-6 text-[14px]",
                                    )}
                                >
                                    See the SDK
                                </a>
                            </div>
                        </div>

                        <dl className="divide-y border-y md:border-l md:border-y-0 md:pl-6">
                            {SPEC.map(([value, label]) => (
                                <div key={label} className="flex items-baseline gap-3 py-3">
                                    <dt className="w-8 font-display text-[28px] leading-none">
                                        {value}
                                    </dt>
                                    <dd className="font-geist text-[12px] text-muted-foreground">
                                        {label}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* Product as the hero image */}
                <section className="mx-auto w-full max-w-6xl px-6">
                    <DashboardPreview />
                    <p className="mt-3 font-geist text-[12px] text-muted-foreground">
                        The dashboard: revenue, subscriptions and setup at a glance —
                        every number here is also an API call.
                    </p>
                </section>

                {/* How money moves */}
                <section id="how" className="mx-auto w-full max-w-6xl px-6 py-28">
                    <div className="mb-14 grid gap-6 md:grid-cols-2 md:items-end">
                        <h2 className="font-display text-[36px] leading-[1.05] tracking-[-0.02em] md:text-[48px]">
                            One integration.
                            <br />
                            Any provider.
                        </h2>
                        <p className="max-w-md text-[15px] leading-7 text-muted-foreground md:justify-self-end">
                            Your app talks to PocketStrip; PocketStrip talks to Stripe or
                            Paystack. Switch providers without rewriting a line of
                            billing logic.
                        </p>
                    </div>
                    <ProviderHub />
                </section>

                {/* Four nouns */}
                <section className="border-y">
                    <div className="mx-auto w-full max-w-6xl px-6 py-20">
                        <h2 className="mb-10 font-display text-[36px] leading-[1.05] tracking-[-0.02em]">
                            Four nouns. That&apos;s the whole model.
                        </h2>
                        <div className="divide-y border-y">
                            {NOUNS.map((n) => (
                                <div
                                    key={n.noun}
                                    className="grid gap-2 py-6 md:grid-cols-[200px_1fr_auto] md:items-center md:gap-8"
                                >
                                    <h3 className="font-display text-[24px] leading-none">
                                        {n.noun}
                                    </h3>
                                    <p className="max-w-xl text-[14px] leading-6 text-muted-foreground">
                                        {n.body}
                                    </p>
                                    <code className="font-mono text-[12px] text-muted-foreground">
                                        {n.code}
                                    </code>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Developers */}
                <section
                    id="developers"
                    className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-28 md:grid-cols-[0.9fr_1.1fr] md:items-center"
                >
                    <div>
                        <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                            For developers
                        </p>
                        <h2 className="mt-4 font-display text-[36px] leading-[1.05] tracking-[-0.02em] md:text-[48px]">
                            Gate a feature in one line.
                        </h2>
                        <p className="mt-5 max-w-md text-[15px] leading-7 text-muted-foreground">
                            No status strings to decode. Ask whether a customer has
                            access and get back a yes, a reason you can branch on, and
                            any usage limit.
                        </p>
                    </div>
                    <CodePanel />
                </section>

                {/* Feature grid */}
                <section className="mx-auto w-full max-w-6xl px-6 pb-28">
                    <div className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="bg-background p-6">
                                <HugeiconsIcon
                                    icon={f.icon}
                                    size={18}
                                    className="text-muted-foreground"
                                />
                                <h3 className="mt-6 text-[15px] font-medium">{f.title}</h3>
                                <p className="mt-1.5 font-geist text-[13px] leading-5 text-muted-foreground">
                                    {f.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Closing line */}
                <section className="relative overflow-hidden border-t">
                    <div className="bg-grid mask-fade absolute inset-0 opacity-60" aria-hidden />
                    <div className="relative mx-auto w-full max-w-6xl px-6 py-28">
                        <h2 className="max-w-4xl font-display text-[48px] leading-[1] tracking-[-0.03em] md:text-[88px]">
                            Stop rebuilding billing.
                        </h2>
                        <Link
                            href="/sign-up"
                            className={cn(buttonVariants(), "mt-10 h-11 gap-2 px-6 text-[14px]")}
                        >
                            Create your first plan
                            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 font-mono text-[11px] text-muted-foreground">
                    <span>© {new Date().getFullYear()} PocketStrip</span>
                    <span>Built for developers</span>
                </div>
            </footer>
        </div>
    );
}
