export function PageHeader({
    title,
    description,
    action,
    eyebrow,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    eyebrow?: string;
}) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.02em]">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-xl font-geist text-[13px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
