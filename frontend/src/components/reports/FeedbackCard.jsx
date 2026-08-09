import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function FeedbackCard({ tone, text }) {
  return (
    <Card className="flex items-start gap-3">
      <Badge tone={tone === 'positive' ? 'signal' : 'amber'}>
        {tone === 'positive' ? 'Strength' : 'To improve'}
      </Badge>
      <p className="text-sm text-text-primary">{text}</p>
    </Card>
  );
}
