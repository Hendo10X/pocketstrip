"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

export default function DashboardPage() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const queryClient = useQueryClient();

    const {
        data: projects = [],
        isLoading,
        isError,
        error: fetchError,
    } = useQuery<ProjectRow[]>({
        queryKey: ["projects"],
        queryFn: async () => {
            const res = await apiFetch("/projects");
            return res.projects ?? [];
        },
    });

    const createProjectMutation = useMutation({
        mutationFn: async (projectName: string) => {
            return apiFetch("/projects", {
                method: "POST",
                body: JSON.stringify({ name: projectName }),
            });
        },
        onSuccess: () => {
            setName("");
            setOpen(false);

            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        createProjectMutation.mutate(name);
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-5xl px-6 py-12">
                {/* Header Section */}
                <div className="flex items-center justify-between pb-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Projects
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage your applications and subscription billing
                            settings.
                        </p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 py-2 gap-2 shadow-none hover:bg-primary">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New project
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md shadow-none">
                            <DialogHeader>
                                <DialogTitle>Create project</DialogTitle>
                                <DialogDescription>
                                    Give your app or project a name to get
                                    started.
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                onSubmit={handleCreate}
                                className="space-y-4 pt-2"
                            >
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-xs font-medium"
                                    >
                                        Project Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="e.g. Acme SaaS"
                                        autoFocus
                                        required
                                    />
                                </div>
                                {createProjectMutation.isError && (
                                    <p className="text-xs font-medium text-destructive">
                                        {(createProjectMutation.error as Error)
                                            ?.message ??
                                            "Failed to create project"}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpen(false)}
                                        className="shadow-none border hover:bg-transparent"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            createProjectMutation.isPending
                                        }
                                        className="shadow-none hover:bg-primary"
                                    >
                                        {createProjectMutation.isPending
                                            ? "Creating..."
                                            : "Create Project"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Content Section */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-24 rounded-xl border bg-muted/40 animate-pulse"
                            />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="p-4 border rounded-xl bg-destructive/10 text-destructive text-sm">
                        {(fetchError as Error)?.message ??
                            "Error loading projects."}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card/50">
                        <h3 className="font-semibold text-base mb-1">
                            No projects found
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm mb-4">
                            You haven't created any projects yet. Create one to
                            start managing plans and billing.
                        </p>
                        <Button
                            size="sm"
                            onClick={() => setOpen(true)}
                            className="shadow-none hover:bg-primary"
                        >
                            Create your first project
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.map(({ project }) => (
                            <Link
                                key={project.id}
                                href={`/dashboard/${project.slug}`}
                            >
                                <div className="flex items-center gap-3 rounded-xl border bg-card p-5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted font-semibold text-sm">
                                        {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm text-foreground">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                            {project.slug}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
