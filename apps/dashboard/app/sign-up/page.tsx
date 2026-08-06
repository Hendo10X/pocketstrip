"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { error } = await authClient.signUp.email({
            email,
            password,
            name,
        });

        setIsSubmitting(false);

        if (error) {
            setError(error.message ?? "Something went wrong");
            return;
        }

        window.location.href = "/dashboard";
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
                        Create your account
                    </h1>
                </div>

                <div className="rounded-xl border p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[12px]">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                                className="h-9 rounded-[8px] text-[13px]"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[12px]">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="john@example.com"
                                className="h-9 rounded-[8px] text-[13px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[12px]">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="h-9 rounded-[8px] text-[13px]"
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
                            {isSubmitting ? "Creating account…" : "Create account"}
                        </Button>
                    </form>
                </div>

                <p className="mt-5 text-center text-[12px] text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
