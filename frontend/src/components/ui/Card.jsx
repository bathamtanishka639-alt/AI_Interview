import { cn } from '../../utils/cn';

/**
 * Card — two variants per Liquid Signal spec:
 *   glass=false (default): flat surface for DATA-DENSE screens (dashboard, report tables)
 *                          high-contrast, legible — bg-surface-raised + solid border
 *   glass=true:            translucent glass for ATMOSPHERIC screens (landing, chat, modals)
 *
 * Spec: cards 20-24px radius. Hover: lift 2-4px + shadow deepen.
 */
export default function Card({ as: Tag = 'div', glass = false, className, children, ...props }) {
  return (
    <Tag
      className={cn(
        // Base: 20px radius, smooth hover lift
        'rounded-card p-5 transition-all duration-200',
        'hover:-translate-y-[3px] hover:shadow-raised',
        glass
          // Glass: atmospheric — translucent, blur, hairline border
          ? 'glass'
          // Flat: data-dense — solid, high-contrast, legible
          : 'bg-surface-raised border border-border shadow-raised',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
