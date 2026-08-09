import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

const LEVEL_TO_PCT = { Developing: 45, Strong: 80, Expert: 95 };

export default function SkillCard({ name, level }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-text-primary">{name}</h3>
        <span className="text-xs text-text-secondary">{level}</span>
      </div>
      <ProgressBar value={LEVEL_TO_PCT[level] ?? 50} />
    </Card>
  );
}
