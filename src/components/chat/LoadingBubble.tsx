'use client';

import { motion } from 'framer-motion';

export function LoadingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="mt-[2px] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFEFED] dark:bg-[#1A1A1A] border border-[#E5E5E3] dark:border-[#2A2A2A]">
        <div className="h-2 w-2 rounded-full bg-[#C96442] animate-pulse" />
      </div>

      {/* Bubble */}
      <div className="rounded-[18px] rounded-tl-sm bg-[#EFEFED] dark:bg-[#1A1A1A] border border-[#E5E5E3] dark:border-[#2A2A2A] px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-[#C96442]"
              animate={{ scaleY: [0.5, 1.2, 0.5], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
            />
          ))}
          <span className="ml-1 text-[13px] text-[#73726C] dark:text-[#888]">Thinking...</span>
        </div>
      </div>
    </motion.div>
  );
}
