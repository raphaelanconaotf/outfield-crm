export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function ComingSoon({ entrega, items }: { entrega: number; items: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface p-8">
      <p className="text-sm font-medium">Chega na entrega {entrega}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
