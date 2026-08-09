"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
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
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                className="w-full max-w-90"
            >
                <div className="mb-6 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand text-[13px] font-bold text-brand-foreground">
                            P
                        </span>
                        PocketStrip
                    </Link>
                    <h1 className="mt-4 text-[18px] font-semibold tracking-tight">
                        Create your account
                    </h1>
                </div>

                <div className="rounded-2xl bg-card p-6">
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
                            <PasswordField
                                value={password}
                                onChange={setPassword}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-9 w-full rounded-[8px] text-[13px]"
                        >
                            {isSubmitting
                                ? "Creating account…"
                                : "Create account"}
                        </Button>
                    </form>
                </div>

                <p className="mt-5 text-center font-geist text-[12px] text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="font-medium text-foreground underline underline-offset-4"
                    >
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
