"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-medium">
                    {initial}
                </div>
                <div className="min-w-0 flex-1">
                    {name && (
                        <p className="truncate text-[12px] leading-4 font-medium">
                            {name}
                        </p>
                    )}
                    <p className="truncate text-[11px] leading-4 text-muted-foreground">
                        {email}
                    </p>
                </div>
            </div>
            <Button
                variant="outline"
                onClick={handleSignOut}
                className="h-8 w-full rounded-[6px] text-[12px]"
            >
                Sign out
            </Button>
        </SidebarFooter>
    );
}
