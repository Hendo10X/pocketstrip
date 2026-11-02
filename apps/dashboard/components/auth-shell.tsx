"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ProviderHub } from "@/components/provider-hub";

function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2 text-[15px] font-medium">
            <span className="flex h-6 w-6 items-center justify-center bg-brand font-display text-[14px] text-brand-foreground">
                P
            </span>
            PocketStrip
        </Link>
    );
}

// Split-screen auth layout: a statement panel on the left (desktop only) and
// the form on the right.
export function AuthShell({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
            <aside className="relative hidden flex-col justify-between overflow-hidden border-r p-10 lg:flex">
                <div className="bg-grid mask-fade absolute inset-0 opacity-50" aria-hidden />
                <div className="relative">
                    <Logo />
                </div>
                <div className="relative">
                    <ProviderHub className="mb-12" />
                    <h2 className="max-w-md font-display text-[40px] leading-[1.05] tracking-[-0.02em]">
                        Billing that stays out of your way.
                    </h2>
                    <p className="mt-4 max-w-sm font-geist text-[13px] leading-6 text-muted-foreground">
                        Plans, customers, subscriptions and entitlements — one SDK on
                        top of the provider you already use.
                    </p>
                </div>
            </aside>

            <main className="flex flex-col px-6 py-10">
                <div className="lg:hidden">
                    <Logo />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                    className="m-auto w-full max-w-90 py-10"
                >
                    <h1 className="font-display text-[32px] leading-[1.05] tracking-[-0.02em]">
                        {title}
                    </h1>
                    <p className="mt-2 font-geist text-[13px] text-muted-foreground">
                        {subtitle}
                    </p>
                    <div className="mt-8">{children}</div>
                    <p className="mt-6 font-geist text-[12px] text-muted-foreground">
                        {footer}
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
