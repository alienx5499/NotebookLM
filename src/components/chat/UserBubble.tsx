'use client';

import { motion } from 'framer-motion';

export function UserBubble({
  content,
  timestamp,
  formatTimestamp,
  index = 0,
}: {
  content: string;
  timestamp: number;
  formatTimestamp: (ts: number) => string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.2, 0, 0, 1] }}
      className="flex justify-end"
    >
      <div className="flex gap-3">
        <div
          className="max-w-[75%] rounded-[18px] rounded-tl-md rounded-tr-sm bg-white dark:bg-[#1A1A1A] border border-[#E5E5E3] dark:border-[#2A2A2A] px-4 py-3.5"
          style={{ maxWidth: '75%' }}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-[#1A1A1A] dark:text-[#EAEAEA] font-medium">
            {content}
          </p>
          <p className="mt-2 text-right text-[10px] text-[#999] dark:text-[#555]">
            {formatTimestamp(timestamp)}
          </p>
        </div>

        <div className="mt-[2px] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C96442]">
          <span className="text-[12px] font-semibold text-white font-heading">U</span>
        </div>
      </div>
    </motion.div>
  );
}
