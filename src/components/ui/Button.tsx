import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

/**
 * Premium tactile button with ripple-like tap animation.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  const sizeMap: Record<Size, string> = {
    sm: 'h-10 px-4 text-sm rounded-xl',
    md: 'h-12 px-5 text-[15px] rounded-2xl',
    lg: 'h-14 px-6 text-base rounded-2xl',
  };

  const variantMap: Record<Variant, string> = {
    primary:
      'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-glow font-semibold',
    secondary:
      'glass-strong text-tg-text font-medium',
    ghost:
      'bg-white/5 hover:bg-white/10 text-tg-text border border-white/10',
    danger:
      'bg-gradient-to-br from-rose-400 to-rose-600 text-white font-semibold',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      disabled={disabled || loading}
      className={[
        'relative inline-flex items-center justify-center gap-2 select-none',
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        sizeMap[size],
        variantMap[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      ) : (
        <>
          {icon ? <span className="shrink-0">{icon}</span> : null}
          {children ? <span className="truncate">{children}</span> : null}
        </>
      )}
    </motion.button>
  );
}
