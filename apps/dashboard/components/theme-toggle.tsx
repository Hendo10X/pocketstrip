"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// Dark is the default. The choice is remembered per browser; the root layout
// applies it before first paint so there's no flash.
export function ThemeToggle({ className }: { className?: string }) {
    const [dark, setDark] = useState(true);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark"));
    }, []);

    function toggle() {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try {
            localStorage.setItem("theme", next ? "dark" : "light");
        } catch {
            // Storage can be unavailable (private mode); the toggle still works.
        }
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
                "flex h-8 w-8 items-center justify-center border text-muted-foreground transition-colors hover:text-foreground active:scale-[0.96]",
                className,
            )}
        >
            <HugeiconsIcon icon={dark ? Sun03Icon : Moon02Icon} size={15} />
        </button>
    );
}
