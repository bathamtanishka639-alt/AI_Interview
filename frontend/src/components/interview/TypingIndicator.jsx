import SignalPulse from '../ui/SignalPulse';

export default function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm bg-agent-50 px-4 py-2.5 dark:bg-agent-500/10">
      <SignalPulse size="sm" />
      <span className="text-xs text-text-secondary">AI is thinking…</span>
    </div>
  );
}
