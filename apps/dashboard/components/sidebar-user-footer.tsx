"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

export function SidebarUserFooter() {
    const router = useRouter();
    const { data: session } = authClient.useSession();

    async function handleSignOut() {
        await authClient.signOut();
        router.push("/sign-in");
    }

    return (
        <SidebarFooter className="px-2 py-3">
            <SidebarMenu>
                <SidebarMenuItem>
                    <span className="block truncate px-2 text-[12px] leading-5 text-muted-foreground">
                        {session?.user?.email ?? ""}
                    </span>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleSignOut}
                        className="h-8 rounded-[6px] text-[13px]"
                    >
                        Sign out
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    );
}
