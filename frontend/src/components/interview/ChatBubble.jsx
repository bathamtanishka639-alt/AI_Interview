import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function ChatBubble({ role, text }) {
  const isAgent = role === 'agent';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex', isAgent ? 'justify-start' : 'justify-end')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-subtle sm:max-w-[70%]',
          isAgent
            ? 'rounded-tl-sm bg-agent-50 text-text-primary dark:bg-agent-500/10'
            : 'rounded-tr-sm bg-signal-500 text-ink-950'
        )}
      >
        {text}
      </div>
    </motion.div>
  );
}
