import { forwardRef } from 'react';
import SignalPulse from './SignalPulse';
import { cn } from '../../utils/cn';

// Spec: primary = gradient-primary only; secondary/ghost = flat surface
const VARIANTS = {
  primary:
    'bg-gradient-to-r from-[#14E0B4] to-[#7C7FFB] text-white shadow-glow ' +
    'hover:scale-[1.02] hover:shadow-glow active:scale-[0.98] ' +
    'focus-visible:outline-[#14E0B4]',
  secondary:
    'bg-surface-raised text-text-primary border border-border ' +
    'hover:bg-border/30 hover:scale-[1.01] active:scale-[0.99]',
  ghost:
    'text-text-secondary hover:bg-surface-raised hover:text-text-primary ' +
    'hover:scale-[1.01] active:scale-[0.99]',
  danger:
    'bg-[#FF5C72] text-white hover:bg-[#E0364E] hover:scale-[1.01] active:scale-[0.99]',
};

// Spec: buttons = 12px border-radius; min touch target h-11 (44px)
const SIZES = {
  sm: 'h-9  min-h-[36px] px-3.5 text-xs',
  md: 'h-11 min-h-[44px] px-5   text-sm',
  lg: 'h-12 min-h-[48px] px-7   text-base',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Spec: buttons = rounded-btn (12px), font-semibold, smooth spring via CSS
        'inline-flex items-center justify-center gap-2',
        'rounded-btn font-semibold transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <SignalPulse size="xs" /> : null}
      {children}
    </button>
  );
});

export default Button;
