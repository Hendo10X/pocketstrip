"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Home01Icon,
    CreditCardIcon,
    UserMultipleIcon,
    Invoice01Icon,
    SourceCodeIcon,
    Settings01Icon,
} from "@hugeicons/core-free-icons";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroupLabel,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
    label: string;
    href: string;
    icon: typeof Home01Icon;
    ready: boolean;
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
    if (!item.ready) {
        return (
            <div
                aria-disabled
                className="relative flex h-9 items-center gap-2.5 rounded-none px-2.5 text-[13px] text-muted-foreground/60"
            >
                <HugeiconsIcon icon={item.icon} size={17} strokeWidth={2} />
                <span className="flex-1">{item.label}</span>
                <span className="bg-muted px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                    Soon
                </span>
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            className="relative flex h-9 items-center gap-2.5 px-3 text-[13px] transition-colors duration-150 hover:bg-sidebar-accent"
        >
            {active && (
                <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-sidebar-accent"
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                >
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-foreground" />
                </motion.span>
            )}
            <HugeiconsIcon
                icon={item.icon}
                size={16}
                strokeWidth={1.8}
                className={
                    active
                        ? "relative z-10 text-foreground"
                        : "relative z-10 text-muted-foreground"
                }
            />
            <span
                className={
                    active
                        ? "relative z-10 font-medium text-foreground"
                        : "relative z-10 text-foreground/80"
                }
            >
                {item.label}
            </span>
        </Link>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const slug = params?.slug as string | undefined;

    const projectNav: NavItem[] = slug
        ? [
              {
                  label: "Overview",
                  href: `/dashboard/${slug}`,
                  icon: Home01Icon,
                  ready: true,
              },
              {
                  label: "Plans",
                  href: `/dashboard/${slug}/plans`,
                  icon: CreditCardIcon,
                  ready: true,
              },
              {
                  label: "Customers",
                  href: `/dashboard/${slug}/customers`,
                  icon: UserMultipleIcon,
                  ready: true,
              },
              {
                  label: "Payments",
                  href: `/dashboard/${slug}/payments`,
                  icon: Invoice01Icon,
                  ready: true,
              },
          ]
        : [];

    const developerNav: NavItem[] = slug
        ? [
              {
                  label: "Developers",
                  href: `/dashboard/${slug}/developers`,
                  icon: SourceCodeIcon,
                  ready: true,
              },
              {
                  label: "Settings",
                  href: `/dashboard/${slug}/settings`,
                  icon: Settings01Icon,
                  ready: true,
              },
          ]
        : [];

    const rootNav: NavItem[] = [
        {
            label: "All projects",
            href: "/dashboard",
            icon: Home01Icon,
            ready: true,
        },
    ];

    return (
        <MotionConfig reducedMotion="user">
            <SidebarProvider
                style={{ "--sidebar-width": "252px" } as React.CSSProperties}
            >
                <Sidebar>
                    <SidebarHeader className="h-14 justify-center border-b px-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-[15px] font-medium"
                        >
                            <span className="flex h-6 w-6 items-center justify-center bg-brand font-display text-[14px] text-brand-foreground">
                                P
                            </span>
                            PocketStrip
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="px-2 py-3">
                        {slug ? (
                            <>
                                <SidebarGroupLabel className="px-3 font-mono text-[10px] tracking-wider uppercase">
                                    Billing
                                </SidebarGroupLabel>
                                <nav className="flex flex-col gap-0.5">
                                    {projectNav.map((item) => (
                                        <NavLink
                                            key={item.href}
                                            item={item}
                                            active={pathname === item.href}
                                        />
                                    ))}
                                </nav>
                                <SidebarGroupLabel className="mt-4 px-3 font-mono text-[10px] tracking-wider uppercase">
                                    Developer
                                </SidebarGroupLabel>
                                <nav className="flex flex-col gap-0.5">
                                    {developerNav.map((item) => (
                                        <NavLink
                                            key={item.href}
                                            item={item}
                                            active={pathname === item.href}
                                        />
                                    ))}
                                </nav>
                            </>
                        ) : (
                            <nav className="flex flex-col gap-0.5">
                                {rootNav.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        item={item}
                                        active={pathname === item.href}
                                    />
                                ))}
                            </nav>
                        )}
                    </SidebarContent>

                    <SidebarUserFooter />
                </Sidebar>

                <SidebarInset>
                    <header className="flex h-14 items-center gap-3 border-b px-4">
                        <SidebarTrigger className="h-8 w-8" />
                        <nav className="flex min-w-0 items-center gap-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                            <Link href="/dashboard" className="transition-colors hover:text-foreground">
                                Projects
                            </Link>
                            {slug && (
                                <>
                                    <span aria-hidden>/</span>
                                    <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                                        <span className="h-1.5 w-1.5 shrink-0 bg-brand" />
                                        <span className="truncate">{slug}</span>
                                    </span>
                                </>
                            )}
                        </nav>
                        <ThemeToggle className="ml-auto" />
                    </header>
                    <main className="flex-1 px-6 py-10 md:px-10">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </MotionConfig>
    );
}
