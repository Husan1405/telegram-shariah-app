import { motion } from 'framer-motion';

/**
 * Decorative background — pure black base with two soft floating orbs
 * for atmospheric depth. No gradients = no visible banding strips.
 */
export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Soft emerald glow at the top */}
      <motion.div
        className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]"
        animate={{ y: [0, 16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle gold glow at the bottom */}
      <motion.div
        className="absolute -bottom-48 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-gold-500/[0.04] blur-[140px]"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
