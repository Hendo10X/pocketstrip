export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center border bg-card py-16 text-center">
            <p className="text-[15px] font-medium">{title}</p>
            <p className="mt-1 max-w-sm font-geist text-[13px] text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
