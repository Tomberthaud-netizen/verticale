interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex-1 min-w-[220px]">
      <p className="text-sm text-muted font-medium">{title}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
    </div>
  );
}
