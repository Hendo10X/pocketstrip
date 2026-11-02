import { HugeiconsIcon } from "@hugeicons/react";
import {
    CodeIcon,
    DashboardSquare01Icon,
    UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// Geometry lives in a 1000x400 box; HTML nodes are positioned with the same
// numbers as percentages, so the SVG connectors always meet them.
const W = 1000;
const H = 400;
const CENTER = { x: 500, y: 200, size: 120 };
const NODE_W = 220;

const SOURCES = [
    { label: "Your app", sub: "SDK + API key", y: 80, icon: CodeIcon },
    { label: "Dashboard", sub: "Plans & customers", y: 200, icon: DashboardSquare01Icon },
    { label: "Customer portal", sub: "Self-serve billing", y: 320, icon: UserCircleIcon },
];

const PROVIDERS = [
    { label: "Stripe", y: 50, live: true },
    { label: "Paystack", y: 150, live: true },
    { label: "Paddle", y: 250, live: false },
    { label: "Lemon Squeezy", y: 350, live: false },
];

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function Connector({ d, live }: { d: string; live: boolean }) {
    return (
        <>
            <path
                d={d}
                fill="none"
                stroke="var(--border)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
            />
            {live && (
                <path
                    d={d}
                    fill="none"
                    stroke="var(--muted-foreground)"
                    strokeWidth={1}
                    strokeDasharray="2 10"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className="animate-flow"
                />
            )}
        </>
    );
}

export function ProviderHub({ className }: { className?: string }) {
    const left = CENTER.x - CENTER.size / 2;
    const right = CENTER.x + CENTER.size / 2;

    return (
        <div className={cn("w-full", className)}>
            {/* Desktop: hub-and-spoke diagram */}
            <div className="relative hidden aspect-[5/2] w-full md:block">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden
                >
                    {SOURCES.map((s) => (
                        <Connector
                            key={s.label}
                            live
                            d={`M${NODE_W} ${s.y} C ${NODE_W + 110} ${s.y}, ${left - 110} ${CENTER.y}, ${left} ${CENTER.y}`}
                        />
                    ))}
                    {PROVIDERS.map((p) => (
                        <Connector
                            key={p.label}
                            live={p.live}
                            d={`M${right} ${CENTER.y} C ${right + 110} ${CENTER.y}, ${W - NODE_W - 110} ${p.y}, ${W - NODE_W} ${p.y}`}
                        />
                    ))}
                </svg>

                {SOURCES.map((s) => (
                    <div
                        key={s.label}
                        className="absolute flex -translate-y-1/2 items-center gap-3 border bg-card px-3 py-2.5"
                        style={{ left: 0, top: pct(s.y, H), width: pct(NODE_W, W) }}
                    >
                        <HugeiconsIcon
                            icon={s.icon}
                            size={16}
                            className="shrink-0 text-muted-foreground"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium">{s.label}</p>
                            <p className="truncate font-geist text-[11px] text-muted-foreground">
                                {s.sub}
                            </p>
                        </div>
                    </div>
                ))}

                <div
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border bg-card"
                    style={{
                        left: pct(CENTER.x, W),
                        top: pct(CENTER.y, H),
                        width: pct(CENTER.size, W),
                        height: pct(CENTER.size, H),
                    }}
                >
                    <span className="flex h-10 w-10 items-center justify-center bg-brand font-display text-[22px] text-brand-foreground">
                        P
                    </span>
                </div>
                <div
                    className="absolute -translate-x-1/2 text-center"
                    style={{
                        left: pct(CENTER.x, W),
                        top: pct(CENTER.y + CENTER.size / 2 + 14, H),
                    }}
                >
                    <p className="text-[13px] font-medium">PocketStrip</p>
                    <p className="font-mono text-[10px] whitespace-nowrap text-muted-foreground">
                        plans · entitlements · webhooks
                    </p>
                </div>

                {PROVIDERS.map((p) => (
                    <div
                        key={p.label}
                        className={cn(
                            "absolute flex -translate-y-1/2 items-center justify-between gap-2 border bg-card px-3 py-2.5",
                            !p.live && "opacity-50",
                        )}
                        style={{
                            left: pct(W - NODE_W, W),
                            top: pct(p.y, H),
                            width: pct(NODE_W, W),
                        }}
                    >
                        <span className="truncate text-[13px] font-medium">{p.label}</span>
                        <span
                            className={cn(
                                "font-mono text-[10px] uppercase",
                                p.live ? "text-foreground" : "text-muted-foreground",
                            )}
                        >
                            {p.live ? "live" : "soon"}
                        </span>
                    </div>
                ))}
            </div>

            {/* Mobile: the same idea as a stack */}
            <div className="space-y-2 md:hidden">
                <div className="grid grid-cols-3 gap-2">
                    {SOURCES.map((s) => (
                        <div key={s.label} className="border bg-card p-2.5 text-center">
                            <HugeiconsIcon
                                icon={s.icon}
                                size={15}
                                className="mx-auto text-muted-foreground"
                            />
                            <p className="mt-1 text-[11px] font-medium">{s.label}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-2 border bg-card py-3">
                    <span className="flex h-6 w-6 items-center justify-center bg-brand font-display text-[14px] text-brand-foreground">
                        P
                    </span>
                    <span className="text-[13px] font-medium">PocketStrip</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map((p) => (
                        <div
                            key={p.label}
                            className={cn(
                                "flex items-center justify-between border bg-card px-2.5 py-2",
                                !p.live && "opacity-50",
                            )}
                        >
                            <span className="text-[12px] font-medium">{p.label}</span>
                            <span className="font-mono text-[9px] uppercase text-muted-foreground">
                                {p.live ? "live" : "soon"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
