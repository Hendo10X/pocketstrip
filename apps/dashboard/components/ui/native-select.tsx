import * as React from "react";
import { cn } from "@/lib/utils";

// A styled native <select>, matching the Input component's look.
function NativeSelect({
    className,
    children,
    ...props
}: React.ComponentProps<"select">) {
    return (
        <select
            data-slot="native-select"
            className={cn(
                "h-9 w-full min-w-0 rounded-none border border-input bg-input/20 px-2 text-[13px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
                className,
            )}
            {...props}
        >
            {children}
        </select>
    );
}

export { NativeSelect };
