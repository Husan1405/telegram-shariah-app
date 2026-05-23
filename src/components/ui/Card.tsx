import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

type Variant = 'glass' | 'solid' | 'gradient';

interface Props extends HTMLMotionProps<'div'> {
  variant?: Variant;
  glow?: boolean;
  noPadding?: boolean;
}

/**
 * Premium card with glassmorphism, soft inner ring and optional glow.
 */
export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { variant = 'glass', glow, noPadding, className = '', children, ...rest },
  ref,
) {
  const base = 'relative rounded-3xl ring-inner-light shadow-glass overflow-hidden';
  const padding = noPadding ? '' : 'p-5';

  const variantClass =
    variant === 'glass'
      ? 'glass'
      : variant === 'gradient'
        ? 'border border-white/10 bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-transparent backdrop-blur-xl'
        : 'border border-white/10 bg-tg-bg-secondary/80 backdrop-blur-xl';

  return (
    <motion.div
      ref={ref}
      className={[base, variantClass, padding, glow ? 'shadow-glow' : '', className].join(' ')}
      {...rest}
    >
      {children}
    </motion.div>
  );
});
