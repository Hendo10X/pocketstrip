"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuBadge,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";

type NavItem = { label: string; href: string; ready: boolean };

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
              { label: "Overview", href: `/dashboard/${slug}`, ready: true },
              { label: "Plans", href: `/dashboard/${slug}/plans`, ready: false },
              {
                  label: "Customers",
                  href: `/dashboard/${slug}/customers`,
                  ready: false,
              },
              {
                  label: "Payments",
                  href: `/dashboard/${slug}/payments`,
                  ready: false,
              },
          ]
        : [];

    const developerNav: NavItem[] = slug
        ? [
              {
                  label: "Developers",
                  href: `/dashboard/${slug}/developers`,
                  ready: true,
              },
              {
                  label: "Settings",
                  href: `/dashboard/${slug}/settings`,
                  ready: false,
              },
          ]
        : [];

    const rootNav: NavItem[] = [
        { label: "All projects", href: "/dashboard", ready: true },
    ];

    function renderItem(item: NavItem) {
        const isActive = pathname === item.href;

        if (!item.ready) {
            return (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        disabled
                        className="h-8 rounded-[6px] text-[13px] text-muted-foreground"
                    >
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className="text-[10px] tracking-wide text-muted-foreground uppercase">
                        Soon
                    </SidebarMenuBadge>
                </SidebarMenuItem>
            );
        }

        return (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    isActive={isActive}
                    render={<Link href={item.href} />}
                    className="h-8 rounded-[6px] text-[13px]"
                >
                    <span>{item.label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarProvider
            style={{ "--sidebar-width": "260px" } as React.CSSProperties}
        >
            <Sidebar>
                <SidebarHeader className="h-15 justify-center px-4">
                    <Link
                        href="/dashboard"
                        className="text-[15px] font-semibold tracking-tight"
                    >
                        PocketStrip
                    </Link>
                </SidebarHeader>

                <SidebarContent className="px-2 py-2">
                    {slug ? (
                        <>
                            <SidebarGroup className="p-0">
                                <SidebarMenu>
                                    {projectNav.map(renderItem)}
                                </SidebarMenu>
                            </SidebarGroup>
                            <SidebarGroup className="mt-2 p-0">
                                <SidebarGroupLabel className="px-2 text-[11px] tracking-wide uppercase">
                                    Developer
                                </SidebarGroupLabel>
                                <SidebarMenu>
                                    {developerNav.map(renderItem)}
                                </SidebarMenu>
                            </SidebarGroup>
                        </>
                    ) : (
                        <SidebarGroup className="p-0">
                            <SidebarMenu>{rootNav.map(renderItem)}</SidebarMenu>
                        </SidebarGroup>
                    )}
                </SidebarContent>

                <SidebarUserFooter />
            </Sidebar>

            <SidebarInset>
                <header className="flex h-15 items-center gap-3 border-b px-4">
                    <SidebarTrigger className="h-8 w-8 rounded-[6px]" />
                    {slug && (
                        <span className="text-[13px] text-muted-foreground">
                            {slug}
                        </span>
                    )}
                </header>
                <main className="flex-1 px-6 py-8">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
