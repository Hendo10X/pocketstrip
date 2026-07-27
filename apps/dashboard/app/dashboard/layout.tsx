import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";
import Link from "next/link";

const NAV_ITEMS = [
    { label: "Overview", href: "/dashboard" },
    { label: "Plans", href: "/dashboard/plans" },
    { label: "Customers", href: "/dashboard/customers" },
    { label: "Payments", href: "/dashboard/payments" },
    { label: "Developers", href: "/dashboard/developers" },
    { label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider
            style={{ "--sidebar-width": "280px" } as React.CSSProperties}
        >
            <Sidebar>
                <SidebarHeader className="h-15 justify-center px-4">
                    <span className="text-[15px] font-medium">PocketStrip</span>
                </SidebarHeader>

                <SidebarContent className="px-2 py-2">
                    <SidebarMenu>
                        {NAV_ITEMS.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton className="h-8 rounded-[6px] text-[13px]">
                                    <Link href={item.href}>{item.label}</Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>

                <SidebarUserFooter />
            </Sidebar>

            <SidebarInset>
                <header className="flex h-15 items-center gap-3 border-b px-4">
                    <SidebarTrigger className="h-8 w-8 rounded-[6px]" />
                </header>
                <main className="flex-1 px-6 py-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
