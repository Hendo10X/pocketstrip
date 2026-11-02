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

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await authClient.signUp.email({
            email,
            password,
            name,
        });

        setIsSubmitting(false);

        if (error) {
            toast.error(error.message ?? "Something went wrong");
            return;
        }

        toast.success("Account created — please sign in");
        router.push("/sign-in");
    }

    return (
        <AuthShell
            title="Create your account"
            subtitle="Start charging for your software in an afternoon."
            footer={
                <>
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        Sign in
                    </Link>
                </>
            }
        >
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
                        className="h-10 text-[13px]"
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
                        className="h-10 text-[13px]"
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
                    {isSubmitting ? "Creating account…" : "Create account"}
                </Button>
            </form>
        </AuthShell>
    );
}
