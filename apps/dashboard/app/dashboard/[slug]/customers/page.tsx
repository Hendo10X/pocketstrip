"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { apiFetch } from "@/lib/api";
import { useProject } from "@/lib/use-project";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type Customer = {
    id: string;
    email: string;
    name: string | null;
    subscription: {
        id: string;
        status: string;
        planName: string;
        currentPeriodEnd: string;
        cancelAt: string | null;
    } | null;
};

type Plan = {
    id: string;
    name: string;
    price: number;
    currency: string;
    billingInterval: string;
};

const LIVE_STATUSES = ["active", "trialing", "past_due"];

function ActionButton(props: React.ComponentProps<typeof Button>) {
    return (
        <Button
            variant="ghost"
            className="h-7 rounded-none px-2 text-[12px]"
            {...props}
        />
    );
}

export default function CustomersPage() {
    const { projectId, slug } = useProject();
    const queryClient = useQueryClient();

    const [createOpen, setCreateOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    const [checkoutFor, setCheckoutFor] = useState<Customer | null>(null);
    const [planId, setPlanId] = useState("");

    const [cancelFor, setCancelFor] = useState<Customer | null>(null);
    const [atPeriodEnd, setAtPeriodEnd] = useState(true);

    const customersQuery = useQuery({
        queryKey: ["customers", projectId],
        queryFn: () =>
            apiFetch(`/projects/${projectId}/customers`) as Promise<{
                customers: Customer[];
            }>,
        enabled: !!projectId,
    });

    const plansQuery = useQuery({
        queryKey: ["plans", projectId],
        queryFn: () =>
            apiFetch(`/projects/${projectId}/plans`) as Promise<{
                plans: Plan[];
            }>,
        enabled: !!projectId,
    });

    const refresh = () =>
        queryClient.invalidateQueries({ queryKey: ["customers", projectId] });

    const createCustomer = useMutation({
        mutationFn: () =>
            apiFetch(`/projects/${projectId}/customers`, {
                method: "POST",
                body: JSON.stringify({ email, name: name || undefined }),
            }),
        onSuccess: () => {
            refresh();
            toast.success("Customer added");
            setEmail("");
            setName("");
            setCreateOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const startCheckout = useMutation({
        mutationFn: async ({ win }: { win: Window | null }) => {
            const result = (await apiFetch(`/projects/${projectId}/checkout`, {
                method: "POST",
                body: JSON.stringify({ customerId: checkoutFor?.id, planId }),
            })) as { checkoutUrl: string };
            return { result, win };
        },
        onSuccess: ({ result, win }) => {
            if (win) win.location.href = result.checkoutUrl;
            else window.location.href = result.checkoutUrl;
            toast.success("Checkout opened in a new tab");
            setCheckoutFor(null);
        },
        onError: (err: Error, { win }) => {
            win?.close();
            toast.error(err.message);
        },
    });

    const portalLink = useMutation({
        mutationFn: (customerId: string) =>
            apiFetch(`/projects/${projectId}/customers/${customerId}/portal-link`, {
                method: "POST",
            }) as Promise<{ portalUrl: string }>,
        onSuccess: ({ portalUrl }) => {
            navigator.clipboard.writeText(portalUrl);
            toast.success("Portal link copied — single use, expires in 15 min");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const cancel = useMutation({
        mutationFn: () =>
            apiFetch(
                `/projects/${projectId}/subscriptions/${cancelFor?.subscription?.id}/cancel`,
                { method: "POST", body: JSON.stringify({ atPeriodEnd }) },
            ),
        onSuccess: () => {
            refresh();
            toast.success(
                atPeriodEnd
                    ? "Subscription will cancel at the end of the period"
                    : "Subscription cancelled",
            );
            setCancelFor(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const customers = customersQuery.data?.customers ?? [];
    const plans = plansQuery.data?.plans ?? [];

    const addButton = (
        <Button
            onClick={() => setCreateOpen(true)}
            className="h-9 gap-1.5 rounded-none px-4 text-[13px]"
        >
            <HugeiconsIcon icon={PlusSignIcon} size={15} />
            New customer
        </Button>
    );

    return (
        <div className="mx-auto w-full max-w-5xl">
            <PageHeader
                title="Customers"
                description="People who buy your plans. Start a test checkout to see the full flow."
                action={addButton}
            />

            {customersQuery.isLoading || !projectId ? (
                <div className="space-y-2">
                    <Skeleton className="h-14 rounded-2xl" />
                    <Skeleton className="h-14 rounded-2xl" />
                </div>
            ) : customers.length === 0 ? (
                <EmptyState
                    title="No customers yet"
                    description="Add a customer here, or create them from your app with the SDK."
                    action={addButton}
                />
            ) : (
                <div className="divide-y overflow-hidden border bg-card">
                    {customers.map((customer) => {
                        const sub = customer.subscription;
                        const isLive = !!sub && LIVE_STATUSES.includes(sub.status);
                        return (
                            <div
                                key={customer.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-medium">
                                        {customer.name ?? customer.email}
                                    </p>
                                    {customer.name && (
                                        <p className="truncate font-geist text-[12px] text-muted-foreground">
                                            {customer.email}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {sub ? (
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-[12px] text-muted-foreground">
                                                    {sub.planName}
                                                </span>
                                                <StatusPill status={sub.status} />
                                            </div>
                                            {isLive && (
                                                <p className="mt-0.5 font-geist text-[11px] text-muted-foreground">
                                                    {sub.cancelAt
                                                        ? `Cancels ${formatDate(sub.cancelAt)}`
                                                        : `Renews ${formatDate(sub.currentPeriodEnd)}`}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="font-geist text-[12px] text-muted-foreground">
                                            No subscription
                                        </span>
                                    )}

                                    <div className="flex items-center">
                                        {!isLive && (
                                            <ActionButton
                                                onClick={() => {
                                                    setPlanId(plans[0]?.id ?? "");
                                                    setCheckoutFor(customer);
                                                }}
                                            >
                                                Checkout
                                            </ActionButton>
                                        )}
                                        <ActionButton
                                            disabled={portalLink.isPending}
                                            onClick={() => portalLink.mutate(customer.id)}
                                        >
                                            Portal link
                                        </ActionButton>
                                        {isLive && !sub?.cancelAt && (
                                            <ActionButton
                                                onClick={() => {
                                                    setAtPeriodEnd(true);
                                                    setCancelFor(customer);
                                                }}
                                            >
                                                Cancel
                                            </ActionButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New customer */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-100 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-[22px] font-normal leading-tight">
                            Add customer
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            createCustomer.mutate();
                        }}
                        className="mt-2 space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="customer-email" className="text-[12px]">
                                Email
                            </Label>
                            <Input
                                id="customer-email"
                                type="email"
                                placeholder="ada@example.com"
                                className="h-9 rounded-none text-[13px]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer-name" className="text-[12px]">
                                Name{" "}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="customer-name"
                                placeholder="Ada Lovelace"
                                className="h-9 rounded-none text-[13px]"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-9 w-full rounded-none text-[13px]"
                            disabled={createCustomer.isPending}
                        >
                            {createCustomer.isPending ? "Adding…" : "Add customer"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Start checkout */}
            <Dialog
                open={!!checkoutFor}
                onOpenChange={(open) => !open && setCheckoutFor(null)}
            >
                <DialogContent className="max-w-100 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-[22px] font-normal leading-tight">
                            Start checkout
                        </DialogTitle>
                        <DialogDescription className="font-geist text-[13px]">
                            Opens the provider&apos;s hosted checkout for{" "}
                            {checkoutFor?.email}. In Stripe test mode, pay with
                            card <code className="font-mono">4242 4242 4242 4242</code>,
                            any future date and any CVC.
                        </DialogDescription>
                    </DialogHeader>
                    {plans.length === 0 ? (
                        <p className="mt-2 font-geist text-[13px] text-muted-foreground">
                            Create a plan first on the{" "}
                            <a
                                href={`/dashboard/${slug}/plans`}
                                className="font-medium text-foreground underline underline-offset-4"
                            >
                                Plans
                            </a>{" "}
                            page.
                        </p>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                // Open the tab synchronously so popup blockers allow it.
                                const win = window.open("about:blank", "_blank");
                                startCheckout.mutate({ win });
                            }}
                            className="mt-2 space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="checkout-plan" className="text-[12px]">
                                    Plan
                                </Label>
                                <NativeSelect
                                    id="checkout-plan"
                                    value={planId}
                                    onChange={(e) => setPlanId(e.target.value)}
                                >
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} —{" "}
                                            {formatMoney(plan.price, plan.currency)} /{" "}
                                            {plan.billingInterval}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <Button
                                type="submit"
                                className="h-9 w-full rounded-none text-[13px]"
                                disabled={startCheckout.isPending || !planId}
                            >
                                {startCheckout.isPending
                                    ? "Creating checkout…"
                                    : "Open checkout"}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Cancel subscription */}
            <Dialog
                open={!!cancelFor}
                onOpenChange={(open) => !open && setCancelFor(null)}
            >
                <DialogContent className="max-w-100 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-[22px] font-normal leading-tight">
                            Cancel subscription
                        </DialogTitle>
                        <DialogDescription className="font-geist text-[13px]">
                            {cancelFor?.email} · {cancelFor?.subscription?.planName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 space-y-2">
                        {[
                            {
                                value: true,
                                title: "At the end of the billing period",
                                body: "They keep access until it ends. Recommended.",
                            },
                            {
                                value: false,
                                title: "Immediately",
                                body: "Access ends now and billing stops.",
                            },
                        ].map((option) => (
                            <label
                                key={String(option.value)}
                                className={`flex cursor-pointer gap-3 rounded-none p-3 transition-colors ${
                                    atPeriodEnd === option.value
                                        ? "bg-muted"
                                        : "hover:bg-muted/50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="cancel-when"
                                    checked={atPeriodEnd === option.value}
                                    onChange={() => setAtPeriodEnd(option.value)}
                                    className="mt-0.5 accent-foreground"
                                />
                                <span>
                                    <span className="block text-[13px] font-medium">
                                        {option.title}
                                    </span>
                                    <span className="block font-geist text-[12px] text-muted-foreground">
                                        {option.body}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <Button
                        variant="destructive"
                        className="mt-4 h-9 w-full rounded-none text-[13px]"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate()}
                    >
                        {cancel.isPending ? "Cancelling…" : "Cancel subscription"}
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
