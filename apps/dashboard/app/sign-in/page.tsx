"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
            <div className="w-full max-w-90">
                <div className="mb-6 text-center">
                    <Link
                        href="/"
                        className="text-[15px] font-semibold tracking-tight"
                    >
                        PocketStrip
                    </Link>
                    <h1 className="mt-4 text-[18px] font-semibold tracking-tight">
                        Sign in to your account
                    </h1>
                </div>

                <div className="rounded-xl border p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[12px]">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                className="h-9 rounded-[8px] text-[13px]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[12px]">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="h-9 rounded-[8px] text-[13px]"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-[12px] text-destructive">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-9 w-full rounded-[8px] text-[13px]"
                        >
                            {isSubmitting ? "Signing in…" : "Sign in"}
                        </Button>
                    </form>
                </div>

                <p className="mt-5 text-center text-[12px] text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
