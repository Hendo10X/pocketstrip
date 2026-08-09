import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
    return (
        <div className="mx-auto flex min-h-screen max-w-100 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-600 dark:text-emerald-400"
                >
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            </div>

            <h1 className="mt-5 text-[22px] font-semibold tracking-tight">
                You&apos;re all set
            </h1>
            <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                Your subscription is active. A confirmation has been sent to
                your email.
            </p>

            <Button
                render={<Link href="/" />}
                className="mt-8 h-9 rounded-[8px] px-4 text-[13px]"
            >
                Return home
            </Button>
        </div>
    );
}
