import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

interface Props {
  value: number;
  /** Function to format the animated value into a string. */
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Smoothly animates between numeric values. Used for the result amounts so
 * recalculations feel fluid instead of jarring jumps.
 */
export function AnimatedNumber({ value, format, duration = 0.8, className }: Props) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format ? format(display) : Math.round(display)}</span>;
}
