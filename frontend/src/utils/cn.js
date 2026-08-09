/** Tiny classnames merger — avoids pulling in a dependency for this alone. */
export function cn(...args) {
  return args.filter(Boolean).join(' ');
}
