import type { Metadata } from "next";
import {
    Geist,
    Geist_Mono,
    Hedvig_Letters_Serif,
    Zalando_Sans,
} from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/lib/query-client";

const zalandoSans = Zalando_Sans({
    subsets: ["latin"],
    variable: "--font-zalando",
});

const hedvigSerif = Hedvig_Letters_Serif({
    subsets: ["latin"],
    variable: "--font-hedvig-serif",
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

// Dark is the default; apply a saved "light" choice before first paint.
const themeScript = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

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
                "dark h-full antialiased font-sans",
                zalandoSans.variable,
                hedvigSerif.variable,
                geistSans.variable,
                geistMono.variable,
            )}
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="flex min-h-full flex-col">
                <QueryProvider>{children}</QueryProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        classNames: {
                            toast: "!rounded-none !border !border-border !bg-popover !text-popover-foreground !font-sans !shadow-none",
                        },
                    }}
                />
            </body>
        </html>
    );
}
