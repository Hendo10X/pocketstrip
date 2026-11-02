"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Copy01Icon } from "@hugeicons/core-free-icons";
import { apiFetch } from "@/lib/api";
import { useProject } from "@/lib/use-project";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type Plan = {
    id: string;
    name: string;
    price: number;
    currency: string;
    billingInterval: "month" | "year";
    trialDays: number;
    features: { key: string; limit: number | null }[];
};

const CURRENCIES = ["usd", "ngn", "eur", "gbp"];

// "reports, seats:5" -> [{ key: "reports" }, { key: "seats", limit: 5 }]
function parseFeatures(input: string) {
    return input
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [key = "", limit] = part.split(":").map((s) => s.trim());
            const parsed = limit ? Number.parseInt(limit, 10) : Number.NaN;
            return Number.isFinite(parsed) ? { key, limit: parsed } : { key };
        })
        .filter((f) => f.key.length > 0);
}

function emptyForm() {
    return {
        name: "",
        price: "",
        currency: "usd",
        billingInterval: "month" as "month" | "year",
        trialDays: "0",
        features: "",
    };
}

export default function PlansPage() {
    const { projectId } = useProject();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const { data, isLoading } = useQuery({
        queryKey: ["plans", projectId],
        queryFn: () =>
            apiFetch(`/projects/${projectId}/plans`) as Promise<{
                plans: Plan[];
            }>,
        enabled: !!projectId,
    });

    const createPlan = useMutation({
        mutationFn: () => {
            const priceInMinorUnits = Math.round(Number(form.price) * 100);
            return apiFetch(`/projects/${projectId}/plans`, {
                method: "POST",
                body: JSON.stringify({
                    name: form.name.trim(),
                    price: priceInMinorUnits,
                    currency: form.currency,
                    billingInterval: form.billingInterval,
                    trialDays: Number.parseInt(form.trialDays, 10) || 0,
                    features: parseFeatures(form.features),
                }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["plans", projectId] });
            toast.success("Plan created");
            setForm(emptyForm());
            setOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const plans = data?.plans ?? [];
    const set = (field: keyof ReturnType<typeof emptyForm>) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm((f) => ({ ...f, [field]: e.target.value }));

    const newPlanButton = (
        <Button
            onClick={() => setOpen(true)}
            className="h-9 gap-1.5 rounded-none px-4 text-[13px]"
        >
            <HugeiconsIcon icon={PlusSignIcon} size={15} />
            New plan
        </Button>
    );

    return (
        <div className="mx-auto w-full max-w-5xl">
            <PageHeader
                title="Plans"
                description="What you sell: price, billing interval, trial, and the features each plan unlocks."
                action={newPlanButton}
            />

            {isLoading || !projectId ? (
                <div className="space-y-2">
                    <Skeleton className="h-16 rounded-2xl" />
                    <Skeleton className="h-16 rounded-2xl" />
                </div>
            ) : plans.length === 0 ? (
                <EmptyState
                    title="No plans yet"
                    description="Create a plan to start selling. You can grant features like “reports” or “seats:5” that your app checks with the entitlements API."
                    action={newPlanButton}
                />
            ) : (
                <div className="divide-y overflow-hidden border bg-card">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-medium">
                                        {plan.name}
                                    </span>
                                    {plan.trialDays > 0 && (
                                        <span className="bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                            {plan.trialDays}-day trial
                                        </span>
                                    )}
                                </div>
                                {plan.features.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {plan.features.map((f) => (
                                            <span
                                                key={f.key}
                                                className="rounded-none bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                                            >
                                                {f.key}
                                                {f.limit !== null && `: ${f.limit}`}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] tabular-nums">
                                    {formatMoney(plan.price, plan.currency)}
                                    <span className="text-muted-foreground">
                                        {" / "}
                                        {plan.billingInterval}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(plan.id);
                                        toast.success("Plan ID copied");
                                    }}
                                    className="flex items-center gap-1 rounded-none px-1.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    title="Copy plan ID (used by the SDK)"
                                >
                                    <HugeiconsIcon icon={Copy01Icon} size={12} />
                                    ID
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-120 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-[22px] font-normal leading-tight">
                            Create plan
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            createPlan.mutate();
                        }}
                        className="mt-2 space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="plan-name" className="text-[12px]">
                                Name
                            </Label>
                            <Input
                                id="plan-name"
                                placeholder="Pro"
                                className="h-9 rounded-none text-[13px]"
                                value={form.name}
                                onChange={set("name")}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-[1fr_110px] gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="plan-price" className="text-[12px]">
                                    Price
                                </Label>
                                <Input
                                    id="plan-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="29.00"
                                    className="h-9 rounded-none text-[13px] tabular-nums"
                                    value={form.price}
                                    onChange={set("price")}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan-currency" className="text-[12px]">
                                    Currency
                                </Label>
                                <NativeSelect
                                    id="plan-currency"
                                    value={form.currency}
                                    onChange={set("currency")}
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c.toUpperCase()}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="plan-interval" className="text-[12px]">
                                    Billed every
                                </Label>
                                <NativeSelect
                                    id="plan-interval"
                                    value={form.billingInterval}
                                    onChange={set("billingInterval")}
                                >
                                    <option value="month">Month</option>
                                    <option value="year">Year</option>
                                </NativeSelect>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan-trial" className="text-[12px]">
                                    Free trial (days)
                                </Label>
                                <Input
                                    id="plan-trial"
                                    type="number"
                                    min="0"
                                    className="h-9 rounded-none text-[13px] tabular-nums"
                                    value={form.trialDays}
                                    onChange={set("trialDays")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="plan-features" className="text-[12px]">
                                Features{" "}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="plan-features"
                                placeholder="reports, seats:5, api_calls:10000"
                                className="h-9 rounded-none font-mono text-[13px]"
                                value={form.features}
                                onChange={set("features")}
                            />
                            <p className="font-geist text-[12px] text-muted-foreground">
                                Comma-separated. Add <code className="font-mono">:number</code>{" "}
                                for a limit.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="h-9 w-full rounded-none text-[13px]"
                            disabled={createPlan.isPending}
                        >
                            {createPlan.isPending ? "Creating…" : "Create plan"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
