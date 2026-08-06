"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";

export function PasswordField({
    id = "password",
    value,
    onChange,
    autoFocus,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    autoFocus?: boolean;
}) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative">
            <Input
                id={id}
                type={show ? "text" : "password"}
                placeholder="••••••••"
                className="h-9 rounded-[8px] pr-9 text-[13px]"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                autoFocus={autoFocus}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:text-foreground active:scale-[0.94]"
            >
                <HugeiconsIcon
                    icon={show ? ViewOffSlashIcon : ViewIcon}
                    size={16}
                    strokeWidth={2}
                />
            </button>
        </div>
    );
}
