export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-h3">{title}</h1>
        <p className="mt-1 max-w-2xl text-small text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
