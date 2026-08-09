import Card from '../ui/Card';
import Badge from '../ui/Badge';

const DIFFICULTY_TONE = { Easy: 'signal', Medium: 'amber', Hard: 'coral' };

export default function QuestionCard({ question, index, total }) {
  if (!question) return null;
  return (
    <Card className="border-agent-500/30 bg-agent-50/40 dark:bg-agent-500/5">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-xs text-text-secondary">Q{index + 1}/{total}</span>
        <Badge tone="agent">{question.skill}</Badge>
        <Badge tone={DIFFICULTY_TONE[question.difficulty] ?? 'neutral'}>{question.difficulty}</Badge>
      </div>
      <p className="font-display text-lg font-medium leading-snug text-text-primary">
        {question.text}
      </p>
    </Card>
  );
}
