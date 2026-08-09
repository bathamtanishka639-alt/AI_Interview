import { BarChart3 } from 'lucide-react';

export default function ChartPlaceholder({ label = 'Score trend' }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-text-secondary">
      <BarChart3 size={22} />
      <p className="text-sm">{label} — connect analytics data to render</p>
    </div>
  );
}
