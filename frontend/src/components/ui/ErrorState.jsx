import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-coral-500/30 bg-coral-500/5 px-6 py-14 text-center">
      <AlertTriangle size={26} className="text-coral-500" />
      <p className="max-w-sm text-sm text-text-primary">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  );
}
