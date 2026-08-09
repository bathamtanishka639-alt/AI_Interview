import Card from '../ui/Card';

export default function ScoreCard({ label, value, outOf = 100 }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold text-text-primary">
        {value}<span className="text-base text-text-secondary">/{outOf}</span>
      </p>
    </Card>
  );
}
