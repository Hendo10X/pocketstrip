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
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-tight">
                        Projects
                    </h1>
                    <p className="mt-1 font-geist text-[13px] text-muted-foreground">
                        Each project is an isolated billing environment.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger
                        className={buttonVariants({
                            className:
                                "h-9 gap-1.5 rounded-[8px] px-4 text-[13px]",
                        })}
                    >
                        <HugeiconsIcon icon={PlusSignIcon} size={15} />
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
                <div className="flex flex-col items-center rounded-xl bg-muted/40 py-16 text-center">
                    <p className="text-[15px] font-medium">No projects yet</p>
                    <p className="mt-1 max-w-xs font-geist text-[13px] text-muted-foreground">
                        Create your first project to start accepting
                        subscriptions.
                    </p>
                    <Button
                        onClick={() => setOpen(true)}
                        className="mt-5 h-9 gap-1.5 rounded-[8px] px-4 text-[13px]"
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
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
                                className="group block h-full rounded-xl bg-card p-5 shadow-sm transition-transform duration-150 hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-brand text-[14px] font-bold text-brand-foreground">
                                        {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-medium">
                                            {project.name}
                                        </p>
                                        <p className="truncate font-geist text-[12px] text-muted-foreground">
                                            {project.slug}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground/80 uppercase">
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
