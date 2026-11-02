"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/password-field";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await authClient.signIn.email({ email, password });

        setIsSubmitting(false);

        if (error) {
            toast.error(error.message ?? "Invalid email or password");
            return;
        }

        router.push("/dashboard");
    }

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Sign in to manage your plans, customers and payments."
            footer={
                <>
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        Sign up
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[12px]">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="h-10 text-[13px]"
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
                    <PasswordField value={password} onChange={setPassword} />
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 w-full text-[13px]"
                >
                    {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthShell>
    );
}
