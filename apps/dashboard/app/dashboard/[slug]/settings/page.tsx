"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { apiFetch } from "@/lib/api";
import { useProject } from "@/lib/use-project";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type ProviderName = "stripe" | "paystack";

type ConnectedProvider = {
    id: string;
    provider: ProviderName;
    isDefault: boolean;
    keyHint: string;
    hasWebhookSecret: boolean;
    createdAt: string;
};

type ProvidersResponse = {
    providers: ConnectedProvider[];
    webhookUrls: Record<ProviderName, string>;
};

const PROVIDERS: {
    id: ProviderName;
    name: string;
    description: string;
    note?: string;
}[] = [
    {
        id: "stripe",
        name: "Stripe",
        description: "Cards and subscriptions worldwide. Recommended for testing.",
    },
    {
        id: "paystack",
        name: "Paystack",
        description: "Cards and bank payments across Africa.",
        note: "One-time charges only for now — recurring renewals aren't supported yet.",
    },
];

const STRIPE_EVENTS = [
    "checkout.session.completed",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.deleted",
];

function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
}

function CopyRow({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex items-center gap-2 rounded-[8px] bg-muted px-3 py-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px]">
                {value}
            </code>
            <button
                type="button"
                onClick={() => copy(value, label)}
                aria-label={`Copy ${label}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:text-foreground active:scale-[0.96]"
            >
                <HugeiconsIcon icon={Copy01Icon} size={14} />
            </button>
        </div>
    );
}

export default function SettingsPage() {
    const { project, projectId, role } = useProject();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<ProviderName | null>(null);
    const [secretKey, setSecretKey] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [makeDefault, setMakeDefault] = useState(false);

    const canEdit = role === "owner" || role === "admin";

    const { data, isLoading } = useQuery({
        queryKey: ["providers", projectId],
        queryFn: () =>
            apiFetch(
                `/projects/${projectId}/providers`,
            ) as Promise<ProvidersResponse>,
        enabled: !!projectId,
    });

    const connected = new Map(
        (data?.providers ?? []).map((p) => [p.provider, p]),
    );

    function openDialog(provider: ProviderName) {
        setSecretKey("");
        setWebhookSecret("");
        setMakeDefault(false);
        setEditing(provider);
    }

    const connect = useMutation({
        mutationFn: (provider: ProviderName) =>
            apiFetch(`/projects/${projectId}/providers/${provider}`, {
                method: "PUT",
                body: JSON.stringify({
                    secretKey,
                    webhookSecret: provider === "stripe" ? webhookSecret : undefined,
                    isDefault: makeDefault,
                }),
            }),
        onSuccess: (_result, provider) => {
            queryClient.invalidateQueries({ queryKey: ["providers", projectId] });
            toast.success(
                `${provider === "stripe" ? "Stripe" : "Paystack"} connected`,
            );
            setEditing(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const disconnect = useMutation({
        mutationFn: (provider: ProviderName) =>
            apiFetch(`/projects/${projectId}/providers/${provider}`, {
                method: "DELETE",
            }),
        onSuccess: (_result, provider) => {
            queryClient.invalidateQueries({ queryKey: ["providers", projectId] });
            toast.success(
                `${provider === "stripe" ? "Stripe" : "Paystack"} disconnected`,
            );
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const editingMeta = PROVIDERS.find((p) => p.id === editing);

    return (
        <div className="mx-auto w-full max-w-3xl">
            <PageHeader
                title="Settings"
                description="Connect a payment provider and find your project details."
            />

            <section>
                <h2 className="mb-3 text-[15px] font-medium">
                    Payment providers
                </h2>

                {isLoading || !projectId ? (
                    <div className="space-y-3">
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {PROVIDERS.map((meta) => {
                            const row = connected.get(meta.id);
                            return (
                                <div
                                    key={meta.id}
                                    className="flex items-start justify-between gap-4 rounded-2xl bg-card p-5"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-medium">
                                                {meta.name}
                                            </span>
                                            {row ? (
                                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    Connected
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    Not connected
                                                </span>
                                            )}
                                            {row?.isDefault && (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 font-geist text-[13px] text-muted-foreground">
                                            {meta.description}
                                        </p>
                                        {row && (
                                            <p className="mt-2 font-mono text-[12px] text-muted-foreground">
                                                {row.keyHint} · connected{" "}
                                                {formatDate(row.createdAt)}
                                            </p>
                                        )}
                                        {meta.note && (
                                            <p className="mt-2 font-geist text-[12px] text-amber-600 dark:text-amber-400">
                                                {meta.note}
                                            </p>
                                        )}
                                    </div>

                                    {canEdit && (
                                        <div className="flex shrink-0 gap-2">
                                            {row && (
                                                <Button
                                                    variant="outline"
                                                    className="h-8 rounded-[8px] px-3 text-[12px]"
                                                    disabled={disconnect.isPending}
                                                    onClick={() =>
                                                        disconnect.mutate(meta.id)
                                                    }
                                                >
                                                    Disconnect
                                                </Button>
                                            )}
                                            <Button
                                                className="h-8 rounded-[8px] px-3 text-[12px]"
                                                onClick={() => openDialog(meta.id)}
                                            >
                                                {row ? "Update keys" : "Connect"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!canEdit && role && (
                    <p className="mt-3 font-geist text-[12px] text-muted-foreground">
                        Only project owners and admins can manage providers.
                    </p>
                )}
            </section>

            {project && (
                <section className="mt-10">
                    <h2 className="mb-3 text-[15px] font-medium">Project</h2>
                    <div className="space-y-4 rounded-2xl bg-card p-5">
                        <div>
                            <p className="font-geist text-[12px] text-muted-foreground">
                                Name
                            </p>
                            <p className="mt-1 text-[13px] font-medium">
                                {project.name}
                            </p>
                        </div>
                        <div>
                            <p className="mb-1.5 font-geist text-[12px] text-muted-foreground">
                                Project ID — used in API calls
                            </p>
                            <CopyRow value={project.id} label="Project ID" />
                        </div>
                    </div>
                </section>
            )}

            <Dialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent className="max-w-120 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-semibold">
                            Connect {editingMeta?.name}
                        </DialogTitle>
                        <DialogDescription className="font-geist text-[13px]">
                            Keys are verified with {editingMeta?.name}, then
                            encrypted before they&apos;re stored. Use test-mode
                            keys while you&apos;re trying things out.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (editing) connect.mutate(editing);
                        }}
                        className="mt-2 space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="secret-key" className="text-[12px]">
                                Secret key
                            </Label>
                            <Input
                                id="secret-key"
                                type="password"
                                autoComplete="off"
                                placeholder="sk_test_…"
                                className="h-9 rounded-[8px] font-mono text-[13px]"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        {editing === "stripe" && (
                            <div className="space-y-2">
                                <Label
                                    htmlFor="webhook-secret"
                                    className="text-[12px]"
                                >
                                    Webhook signing secret
                                </Label>
                                <Input
                                    id="webhook-secret"
                                    type="password"
                                    autoComplete="off"
                                    placeholder="whsec_…"
                                    className="h-9 rounded-[8px] font-mono text-[13px]"
                                    value={webhookSecret}
                                    onChange={(e) =>
                                        setWebhookSecret(e.target.value)
                                    }
                                    required
                                />
                                <p className="font-geist text-[12px] leading-5 text-muted-foreground">
                                    Testing locally? Run{" "}
                                    <code className="font-mono text-[11px] text-foreground">
                                        stripe listen --forward-to
                                        localhost:4000/webhooks/stripe
                                    </code>{" "}
                                    and paste the <code className="font-mono">whsec_</code>{" "}
                                    it prints. In production, add the endpoint
                                    below in Stripe → Developers → Webhooks.
                                </p>
                            </div>
                        )}

                        {editing && data?.webhookUrls?.[editing] && (
                            <div className="space-y-2">
                                <Label className="text-[12px]">
                                    Webhook endpoint URL
                                </Label>
                                <CopyRow
                                    value={data.webhookUrls[editing]}
                                    label="Webhook URL"
                                />
                                {editing === "stripe" && (
                                    <p className="font-geist text-[12px] leading-5 text-muted-foreground">
                                        Send these events:{" "}
                                        {STRIPE_EVENTS.join(", ")}.
                                    </p>
                                )}
                            </div>
                        )}

                        {connected.size > 0 && !connected.get(editing!)?.isDefault && (
                            <label className="flex items-center gap-2 font-geist text-[13px]">
                                <input
                                    type="checkbox"
                                    checked={makeDefault}
                                    onChange={(e) => setMakeDefault(e.target.checked)}
                                    className="h-4 w-4 accent-foreground"
                                />
                                Use as the default provider for checkouts
                            </label>
                        )}

                        <Button
                            type="submit"
                            className="h-9 w-full rounded-[8px] text-[13px]"
                            disabled={connect.isPending}
                        >
                            {connect.isPending ? "Verifying…" : "Verify and connect"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
