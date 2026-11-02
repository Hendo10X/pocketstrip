export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="mb-8 flex items-end justify-between gap-4">
            <div>
                <h1 className="text-[22px] font-semibold tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 font-geist text-[13px] text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
