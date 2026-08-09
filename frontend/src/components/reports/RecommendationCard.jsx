import Card from '../ui/Card';
import { ArrowUpRight } from 'lucide-react';

export default function RecommendationCard({ title, description }) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <h4 className="font-medium text-text-primary">{title}</h4>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-signal-600" />
    </Card>
  );
}
