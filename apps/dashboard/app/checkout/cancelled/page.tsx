import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelledPage() {
    return (
        <div className="mx-auto flex min-h-screen max-w-120 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-muted-foreground"
                >
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </div>

            <h1 className="mt-5 text-[24px] font-medium leading-8">
                Checkout cancelled
            </h1>
            <p className="mt-2 text-[13px] leading-5.5 text-muted-foreground">
                No charge was made. You can try again whenever you&apos;re
                ready.
            </p>

            <Button className="mt-8 h-9 rounded-[8px] px-4">
                <Link href="/">Return home</Link>
            </Button>
        </div>
    );
}
