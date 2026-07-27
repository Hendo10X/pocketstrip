"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <div className="max-w-[1600px]">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-[24px] font-medium leading-8">Overview</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger
                        className={buttonVariants({
                            className: "h-9 rounded-[8px] px-4 text-[13px]",
                        })}
                    >
                        New project
                    </DialogTrigger>
                    <DialogContent className="max-w-120 rounded-[12px]">
                        <DialogHeader>
                            <DialogTitle className="text-[18px] font-medium">
                                Create project
                            </DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                createProject.mutate(name);
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[12px]">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    className="h-9 rounded-[8px] text-[13px]"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            {createProject.isError && (
                                <p className="text-[12px] text-red-600">
                                    {createProject.error.message}
                                </p>
                            )}
                            <Button
                                type="submit"
                                className="h-9 w-full rounded-[8px] text-[13px]"
                                disabled={createProject.isPending}
                            >
                                {createProject.isPending
                                    ? "Creating..."
                                    : "Create"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <p className="text-[13px] leading-5.5 text-muted-foreground">
                    Loading...
                </p>
            ) : projects.length === 0 ? (
                <Card className="rounded-[10px] border border-neutral-200 p-5 text-center dark:border-neutral-800">
                    <p className="text-[15px] font-medium leading-6">
                        No projects yet
                    </p>
                    <p className="mt-1 text-[13px] leading-5.5 text-muted-foreground">
                        Create your first project to start accepting
                        subscriptions.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-3 gap-6">
                    {projects.map(({ project, role }) => (
                        <Link
                            key={project.id}
                            href={`/dashboard/${project.slug}`}
                        >
                            <Card className="rounded-[10px] border border-neutral-200 p-5 transition-colors hover:bg-accent dark:border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-[15px] font-medium leading-6">
                                        {project.name}
                                    </span>
                                    <span className="text-[12px] leading-5 uppercase text-muted-foreground">
                                        {role}
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
