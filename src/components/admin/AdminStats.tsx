export default function AdminStats({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold mt-2 text-zinc-900">{value}</p>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-amber-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
