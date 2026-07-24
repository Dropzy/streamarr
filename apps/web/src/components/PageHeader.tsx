export function PageHeader({
  title,
  action,
  eyebrow = "Workspace",
}: {
  title: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="topline">
      <div>
        <p className="muted">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}
