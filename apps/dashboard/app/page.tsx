import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
    {
        title: "Plans, not price objects",
        body: "Define what you sell in one call. No products, prices, or payment intents to wire up.",
    },
    {
        title: "Provider-agnostic",
        body: "Stripe today, Paystack or Paddle tomorrow — integrate once, switch without rewriting.",
    },
    {
        title: "Entitlements built in",
        body: "Ask whether a customer has access to a feature. Billing and permissions, together.",
    },
];

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="mx-auto flex h-15 w-full max-w-5xl items-center justify-between px-6">
                <span className="text-[15px] font-semibold tracking-tight">
                    PocketStrip
                </span>
                <nav className="flex items-center gap-2">
                    <Link
                        href="/sign-in"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "h-8 px-3 text-[13px]",
                        )}
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/sign-up"
                        className={cn(
                            buttonVariants(),
                            "h-8 rounded-[8px] px-3 text-[13px]",
                        )}
                    >
                        Get started
                    </Link>
                </nav>
            </header>

            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
                <section className="flex flex-col items-start py-24 md:py-32">
                    <span className="rounded-full border px-3 py-1 text-[12px] text-muted-foreground">
                        Billing for SaaS
                    </span>
                    <h1 className="mt-6 max-w-2xl text-[40px] leading-[1.1] font-semibold tracking-tight md:text-[52px]">
                        Start charging customers in minutes, not weeks.
                    </h1>
                    <p className="mt-5 max-w-xl text-[15px] leading-6 text-muted-foreground">
                        PocketStrip is the billing layer for subscription
                        software. Define plans, drop in the SDK, and let us
                        orchestrate checkout, renewals, and customer access —
                        so you can get back to building.
                    </p>
                    <div className="mt-8 flex items-center gap-3">
                        <Link
                            href="/sign-up"
                            className={cn(
                                buttonVariants(),
                                "h-10 rounded-[8px] px-5 text-[13px]",
                            )}
                        >
                            Create an account
                        </Link>
                        <Link
                            href="/sign-in"
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-10 rounded-[8px] px-5 text-[13px]",
                            )}
                        >
                            Sign in
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 border-t py-16 md:grid-cols-3">
                    {features.map((f) => (
                        <div key={f.title}>
                            <h3 className="text-[14px] font-medium">
                                {f.title}
                            </h3>
                            <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                                {f.body}
                            </p>
                        </div>
                    ))}
                </section>
            </main>

            <footer className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between border-t px-6 text-[12px] text-muted-foreground">
                <span>© {new Date().getFullYear()} PocketStrip</span>
                <span>Built for developers</span>
            </footer>
        </div>
    );
}
