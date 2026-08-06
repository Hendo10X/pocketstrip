import type { Metadata } from "next";
import { Geist, Geist_Mono, Zalando_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/lib/query-client";

const zalandoSans = Zalando_Sans({
    subsets: ["latin"],
    variable: "--font-zalando",
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "PocketStrip",
        template: "%s · PocketStrip",
    },
    description:
        "Developer-first subscription billing. Plans, customers, and recurring payments through one clean API.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn(
                "h-full antialiased font-sans",
                zalandoSans.variable,
                geistSans.variable,
                geistMono.variable,
            )}
        >
            <body className="flex min-h-full flex-col">
                <QueryProvider>{children}</QueryProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        classNames: {
                            toast: "!rounded-[10px] !border !border-border !bg-popover !text-popover-foreground !font-sans",
                        },
                    }}
                />
            </body>
        </html>
    );
}
