"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useProject } from "@/lib/use-project";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { Skeleton } from "@/components/ui/skeleton";

type Invoice = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
    customerEmail: string;
    customerName: string | null;
};

export default function PaymentsPage() {
    const { projectId } = useProject();

    const { data, isLoading } = useQuery({
        queryKey: ["invoices", projectId],
        queryFn: () =>
            apiFetch(`/projects/${projectId}/invoices`) as Promise<{
                invoices: Invoice[];
            }>,
        enabled: !!projectId,
    });

    const invoices = data?.invoices ?? [];

    return (
        <div className="mx-auto w-full max-w-5xl">
            <PageHeader
                title="Payments"
                description="Every charge and failed payment, recorded from your provider's webhooks."
            />

            {isLoading || !projectId ? (
                <div className="space-y-2">
                    <Skeleton className="h-11 rounded-lg" />
                    <Skeleton className="h-11 rounded-lg" />
                </div>
            ) : invoices.length === 0 ? (
                <EmptyState
                    title="No payments yet"
                    description="Payments appear here after a customer completes checkout and your provider's webhook reaches PocketStrip."
                />
            ) : (
                <div className="overflow-hidden border bg-card">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b bg-muted/40 font-geist">
                                <th className="h-10 px-4 text-[12px] font-medium text-muted-foreground">
                                    Date
                                </th>
                                <th className="h-10 px-4 text-[12px] font-medium text-muted-foreground">
                                    Customer
                                </th>
                                <th className="h-10 px-4 text-right text-[12px] font-medium text-muted-foreground">
                                    Amount
                                </th>
                                <th className="h-10 px-4 text-[12px] font-medium text-muted-foreground">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    className="border-b transition-colors last:border-0 hover:bg-muted/30"
                                >
                                    <td className="h-11 px-4 font-geist text-muted-foreground">
                                        {formatDate(invoice.paidAt ?? invoice.createdAt)}
                                    </td>
                                    <td className="h-11 px-4">
                                        <span className="font-medium">
                                            {invoice.customerName ?? invoice.customerEmail}
                                        </span>
                                    </td>
                                    <td className="h-11 px-4 text-right tabular-nums">
                                        {formatMoney(invoice.amount, invoice.currency)}
                                    </td>
                                    <td className="h-11 px-4">
                                        <StatusPill status={invoice.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
