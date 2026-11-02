"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { SidebarFooter } from "@/components/ui/sidebar";

export function SidebarUserFooter() {
    const router = useRouter();
    const { data: session } = authClient.useSession();

    async function handleSignOut() {
        await authClient.signOut();
        router.push("/sign-in");
    }

    const email = session?.user?.email ?? "";
    const name = session?.user?.name ?? "";
    const initial = (name || email || "?").charAt(0).toUpperCase();

    return (
        <SidebarFooter className="gap-2 border-t p-3">
            <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[12px] font-semibold text-background">
                    {initial}
                </div>
                <div className="min-w-0 flex-1">
                    {name && (
                        <p className="truncate text-[12px] leading-4 font-medium">
                            {name}
                        </p>
                    )}
                    <p className="truncate font-geist text-[11px] leading-4 text-muted-foreground">
                        {email}
                    </p>
                </div>
                <button
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground active:scale-[0.96]"
                >
                    <HugeiconsIcon
                        icon={Logout01Icon}
                        size={16}
                        strokeWidth={2}
                    />
                </button>
            </div>
        </SidebarFooter>
    );
}
