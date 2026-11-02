"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
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
            toast.success("Project created");
            setName("");
            setOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const projects: ProjectRow[] = data?.projects ?? [];

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
                <div>
                    <p className="mb-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                        Workspace
                    </p>
                    <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.02em]">
                        Projects
                    </h1>
                    <p className="mt-2 font-geist text-[13px] text-muted-foreground">
                        Each project is an isolated billing environment with its own
                        plans, customers and keys.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger
                        className={buttonVariants({
                            className:
                                "h-9 gap-1.5 rounded-none px-4 text-[13px]",
                        })}
                    >
                        <HugeiconsIcon icon={PlusSignIcon} size={15} />
                        New project
                    </DialogTrigger>
                    <DialogContent className="max-w-100 rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-display text-[22px] font-normal leading-tight">
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
                                    className="h-9 rounded-none text-[13px]"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-9 w-full rounded-none text-[13px]"
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
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center border bg-card py-16 text-center">
                    <p className="text-[15px] font-medium">No projects yet</p>
                    <p className="mt-1 max-w-xs font-geist text-[13px] text-muted-foreground">
                        Create your first project to start accepting
                        subscriptions.
                    </p>
                    <Button
                        onClick={() => setOpen(true)}
                        className="mt-5 h-9 gap-1.5 rounded-none px-4 text-[13px]"
                    >
                        <HugeiconsIcon icon={PlusSignIcon} size={15} />
                        New project
                    </Button>
                </div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                    }}
                    className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3"
                >
                    {projects.map(({ project, role }) => (
                        <motion.div
                            key={project.id}
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                        >
                            <Link
                                href={`/dashboard/${project.slug}`}
                                className="group flex h-full min-h-40 flex-col justify-between bg-background p-6 transition-colors duration-150 hover:bg-card"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-display text-[24px] leading-tight">
                                        {project.name}
                                    </p>
                                    <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                                        {project.slug}
                                    </p>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                                        {role}
                                    </span>
                                    <HugeiconsIcon
                                        icon={ArrowRight01Icon}
                                        size={16}
                                        className="text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                                    />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
