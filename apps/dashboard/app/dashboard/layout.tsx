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
                className="relative flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] text-muted-foreground/60"
            >
                <HugeiconsIcon icon={item.icon} size={17} strokeWidth={2} />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                    Soon
                </span>
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            className="relative flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] transition-colors duration-150 hover:bg-sidebar-accent"
        >
            {active && (
                <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-[8px] bg-brand/15"
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
            )}
            <HugeiconsIcon
                icon={item.icon}
                size={17}
                strokeWidth={2}
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
                  ready: false,
              },
              {
                  label: "Customers",
                  href: `/dashboard/${slug}/customers`,
                  icon: UserMultipleIcon,
                  ready: false,
              },
              {
                  label: "Payments",
                  href: `/dashboard/${slug}/payments`,
                  icon: Invoice01Icon,
                  ready: false,
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
                  ready: false,
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
                    <SidebarHeader className="h-15 justify-center px-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
                        >
                            <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand text-[13px] font-bold text-brand-foreground">
                                P
                            </span>
                            PocketStrip
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="px-2 py-2">
                        {slug ? (
                            <>
                                <nav className="flex flex-col gap-0.5">
                                    {projectNav.map((item) => (
                                        <NavLink
                                            key={item.href}
                                            item={item}
                                            active={pathname === item.href}
                                        />
                                    ))}
                                </nav>
                                <SidebarGroupLabel className="mt-3 px-2.5 text-[10px] tracking-wider uppercase">
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
                    <header className="flex h-15 items-center gap-3 border-b px-4">
                        <SidebarTrigger className="h-8 w-8 rounded-[6px]" />
                        {slug && (
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                                {slug}
                            </div>
                        )}
                    </header>
                    <main className="flex-1 px-6 py-8">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </MotionConfig>
    );
}
