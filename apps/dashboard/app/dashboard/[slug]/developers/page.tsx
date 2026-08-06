"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiKeyRow = {
    id: string;
    name: string;
    keyPrefix: string;
    lastUsedAt: string | null;
    createdAt: string;
};

export default function DevelopersPage() {
    const params = useParams();
    const slug = params.slug as string;
    const queryClient = useQueryClient();

    const [projectId, setProjectId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        apiFetch(`/projects/by-slug/${slug}`).then((data) =>
            setProjectId(data.project.id),
        );
    }, [slug]);

    const { data, isLoading } = useQuery({
        queryKey: ["api-keys", projectId],
        queryFn: () => apiFetch(`/projects/${projectId}/api-keys`),
        enabled: !!projectId,
    });

    const createKey = useMutation({
        mutationFn: (name: string) =>
            apiFetch(`/projects/${projectId}/api-keys`, {
                method: "POST",
                body: JSON.stringify({ name }),
            }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({
                queryKey: ["api-keys", projectId],
            });
            setRevealedKey(result.key);
            setName("");
            setOpen(false);
        },
    });

    const keys: ApiKeyRow[] = data?.apiKeys ?? [];

    function copyKey() {
        if (!revealedKey) return;
        navigator.clipboard.writeText(revealedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-tight">
                        Developers
                    </h1>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        API keys for authenticating the PocketStrip SDK.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <Button
                        onClick={() => setOpen(true)}
                        className="h-9 rounded-[8px] px-4 text-[13px]"
                    >
                        New API key
                    </Button>
                    <DialogContent className="max-w-100 rounded-[12px]">
                        <DialogHeader>
                            <DialogTitle className="text-[16px] font-semibold">
                                Create API key
                            </DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                createKey.mutate(name);
                            }}
                            className="mt-2 space-y-4"
                        >
                            <div className="space-y-2">
                                <Label
                                    htmlFor="key-name"
                                    className="text-[12px]"
                                >
                                    Name
                                </Label>
                                <Input
                                    id="key-name"
                                    placeholder="Production"
                                    className="h-9 rounded-[8px] text-[13px]"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-9 w-full rounded-[8px] text-[13px]"
                                disabled={createKey.isPending}
                            >
                                {createKey.isPending
                                    ? "Creating…"
                                    : "Create key"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading || !projectId ? (
                <div className="space-y-2">
                    <Skeleton className="h-11 rounded-lg" />
                    <Skeleton className="h-11 rounded-lg" />
                </div>
            ) : keys.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
                    <p className="text-[15px] font-medium">No API keys yet</p>
                    <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
                        Create a key to start integrating the PocketStrip SDK.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b bg-muted/40">
                                <th className="h-10 px-4 text-[12px] font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="h-10 px-4 text-[12px] font-medium text-muted-foreground">
                                    Key
                                </th>
                                <th className="h-10 px-4 text-[12px] font-medium text-muted-foreground">
                                    Last used
                                </th>
                                <th className="h-10 px-4 text-[12px] font-medium text-muted-foreground">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map((key) => (
                                <tr
                                    key={key.id}
                                    className="border-b last:border-0 hover:bg-muted/30"
                                >
                                    <td className="h-11 px-4 font-medium">
                                        {key.name}
                                    </td>
                                    <td className="h-11 px-4 font-mono text-[12px] text-muted-foreground">
                                        {key.keyPrefix}…
                                    </td>
                                    <td className="h-11 px-4 text-muted-foreground">
                                        {key.lastUsedAt
                                            ? new Date(
                                                  key.lastUsedAt,
                                              ).toLocaleDateString()
                                            : "Never"}
                                    </td>
                                    <td className="h-11 px-4 text-muted-foreground">
                                        {new Date(
                                            key.createdAt,
                                        ).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog
                open={!!revealedKey}
                onOpenChange={() => setRevealedKey(null)}
            >
                <DialogContent className="max-w-108 rounded-[12px]">
                    <DialogHeader>
                        <DialogTitle className="text-[16px] font-semibold">
                            Copy your API key
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-[13px] leading-5.5 text-muted-foreground">
                        This is the only time you&apos;ll see the full key. Store
                        it somewhere safe — you can&apos;t retrieve it later.
                    </p>
                    <div className="mt-3 flex items-center gap-2 rounded-[8px] border bg-muted/50 p-3">
                        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px]">
                            {revealedKey}
                        </code>
                    </div>
                    <Button
                        onClick={copyKey}
                        className="mt-4 h-9 w-full rounded-[8px] text-[13px]"
                    >
                        {copied ? "Copied" : "Copy to clipboard"}
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
