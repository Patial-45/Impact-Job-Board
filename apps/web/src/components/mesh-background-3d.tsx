'use client';

import { motion } from 'framer-motion';

export function MeshBackground3D({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* Orb 1: Emerald glow */}
      <motion.div
        animate={{
          x: [0, 45, -30, 0],
          y: [0, -40, 25, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full bg-emerald-500/12 blur-[120px] dark:bg-emerald-500/18"
      />

      {/* Orb 2: Electric Indigo glow */}
      <motion.div
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 50, -35, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[130px] dark:bg-indigo-500/15"
      />

      {/* Orb 3: Cyan ambient */}
      <motion.div
        animate={{
          x: [0, 30, -45, 0],
          y: [0, -25, 45, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[110px] dark:bg-cyan-500/12"
      />

      {/* Subtle Grid Lattice Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
