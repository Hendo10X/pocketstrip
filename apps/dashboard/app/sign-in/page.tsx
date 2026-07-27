"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { error } = await authClient.signIn.email({ email, password });

        setIsSubmitting(false);

        if (error) {
            setError(error.message ?? "Invalid email or password");
            return;
        }

        router.push("/dashboard");
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-6">
            <div className="w-full max-w-120 rounded-[10px] border border-neutral-200 p-8 dark:border-neutral-800">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label
                            htmlFor="email"
                            className="text-[13px] font-medium"
                        >
                            Email
                        </Label>
                        <input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            className="h-10 w-full rounded-[8px] bg-neutral-100 px-3 text-[13px] outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-300 dark:bg-neutral-800 dark:placeholder:text-neutral-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="password"
                            className="text-[13px] font-medium"
                        >
                            Password
                        </Label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="h-10 w-full rounded-[8px] bg-neutral-100 px-3 text-[13px] outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-300 dark:bg-neutral-800 dark:placeholder:text-neutral-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-[12px] text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-10 w-full rounded-[8px] bg-neutral-900 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
                    >
                        {isSubmitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>

            <p className="absolute bottom-8 text-center text-[12px] text-neutral-500">
                Don&apos;t have an account?{" "}
                <Link
                    href="/sign-up"
                    className="font-medium text-neutral-900 underline underline-offset-4 dark:text-white"
                >
                    Sign up
                </Link>
            </p>
        </div>
    );
}
