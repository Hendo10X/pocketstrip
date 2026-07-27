import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
    return (
        <div className="mx-auto flex min-h-screen max-w-120 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-600">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-emerald-600"
                >
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            </div>

            <h1 className="mt-5 text-[24px] font-medium leading-8">
                You&apos;re all set
            </h1>
            <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                Your subscription is active. A confirmation has been sent to
                your email.
            </p>

            <Button className="mt-8 h-9 rounded-[8px] px-4">
                <Link href="/">Return home</Link>
            </Button>
        </div>
    );
}
