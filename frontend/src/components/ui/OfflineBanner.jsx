import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-coral-500 px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff size={16} />
      You're offline. Some actions won't work until your connection is back.
    </div>
  );
}
