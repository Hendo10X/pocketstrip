"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type Project = { id: string; name: string; slug: string };

// Resolves the current project from the `[slug]` route segment.
export function useProject() {
    const { slug } = useParams<{ slug: string }>();

    const query = useQuery({
        queryKey: ["project", slug],
        queryFn: () =>
            apiFetch(`/projects/by-slug/${slug}`) as Promise<{
                project: Project;
                role: string;
            }>,
        enabled: !!slug,
    });

    return {
        slug,
        project: query.data?.project,
        projectId: query.data?.project.id,
        role: query.data?.role,
        isLoading: query.isLoading,
        error: query.error,
    };
}
