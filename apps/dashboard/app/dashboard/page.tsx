"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProjectRow = {
    project: { id: string; name: string; slug: string };
    role: string;
};

export default function DashboardOverviewPage() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: () => apiFetch("/projects"),
    });

    const createProject = useMutation({
        mutationFn: (name: string) =>
            apiFetch("/projects", {
                method: "POST",
                body: JSON.stringify({ name }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setName("");
            setOpen(false);
        },
    });

    const projects: ProjectRow[] = data?.projects ?? [];

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-tight">
                        Projects
                    </h1>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        Each project is an isolated billing environment.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger
                        className={buttonVariants({
                            className: "h-9 rounded-[8px] px-4 text-[13px]",
                        })}
                    >
                        New project
                    </DialogTrigger>
                    <DialogContent className="max-w-100 rounded-[12px]">
                        <DialogHeader>
                            <DialogTitle className="text-[16px] font-semibold">
                                Create project
                            </DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                createProject.mutate(name);
                            }}
                            className="mt-2 space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[12px]">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Acme Inc."
                                    className="h-9 rounded-[8px] text-[13px]"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            {createProject.isError && (
                                <p className="text-[12px] text-destructive">
                                    {createProject.error.message}
                                </p>
                            )}
                            <Button
                                type="submit"
                                className="h-9 w-full rounded-[8px] text-[13px]"
                                disabled={createProject.isPending}
                            >
                                {createProject.isPending
                                    ? "Creating…"
                                    : "Create project"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
                    <p className="text-[15px] font-medium">No projects yet</p>
                    <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
                        Create your first project to start accepting
                        subscriptions.
                    </p>
                    <Button
                        onClick={() => setOpen(true)}
                        className="mt-5 h-9 rounded-[8px] px-4 text-[13px]"
                    >
                        New project
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map(({ project, role }) => (
                        <Link
                            key={project.id}
                            href={`/dashboard/${project.slug}`}
                            className="group"
                        >
                            <div className="h-full rounded-xl border bg-card p-5 transition-colors group-hover:border-foreground/20 group-hover:bg-accent">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground">
                                        {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-medium">
                                            {project.name}
                                        </p>
                                        <p className="truncate text-[12px] text-muted-foreground">
                                            {project.slug}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                        {role}
                                    </span>
                                    <span className="text-[12px] text-muted-foreground transition-transform group-hover:translate-x-0.5">
                                        →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
