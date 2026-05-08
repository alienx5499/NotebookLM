'use client';

import { motion } from 'framer-motion';
import { MarkdownText } from './MarkdownText';

function SourceChip({
  source,
  index,
  id,
  expanded,
  onToggle,
}: {
  source: { pageContent: string; pageNumber?: number; source: string };
  index: number;
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="border border-[#E5E5E3] dark:border-[#2A2A2A] rounded-[14px] overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#EFEFED] dark:hover:bg-[#1A1A1A] transition-colors"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C96442]/10 text-[9px] font-bold text-[#C96442]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-[#73726C] dark:text-[#888888] truncate">
            {source.source}
            {source.pageNumber ? ` · p.${source.pageNumber}` : ''}
          </p>
        </div>
        <svg
          className="h-3.5 w-3.5 shrink-0 text-[#999] dark:text-[#666] transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: expanded ? 300 : 0, opacity: expanded ? 1 : 0 }}
      >
        <div className="border-t border-[#E5E5E3] dark:border-[#2A2A2A] px-3 py-2.5">
          <p className="text-[11px] leading-[1.6] text-[#73726C] dark:text-[#888] whitespace-pre-wrap">
            {source.pageContent}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChatBubble({
  msg,
  expandedSources,
  onToggleSource,
  formatTimestamp,
  index = 0,
}: {
  msg: {
    id: string;
    content: string;
    sources?: Array<{
      pageContent: string;
      pageNumber?: number;
      source: string;
    }>;
    timestamp: number;
  };
  expandedSources: Set<string>;
  onToggleSource: (id: string) => void;
  formatTimestamp: (ts: number) => string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.2, 0, 0, 1] }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="mt-[2px] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFEFED] dark:bg-[#1A1A1A] border border-[#E5E5E3] dark:border-[#2A2A2A]">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C96442"
          strokeWidth="1.8"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="rounded-[18px] rounded-tl-sm bg-[#EFEFED] dark:bg-[#1A1A1A] border border-[#E5E5E3] dark:border-[#2A2A2A] px-4 py-3.5">
          <MarkdownText content={msg.content} />

          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-4 border-t border-[#E5E5E3] dark:border-[#2A2A2A] pt-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest font-heading text-[#999] dark:text-[#666]">
                Sources
              </p>
              <div className="space-y-2">
                {msg.sources.map((s, i) => (
                  <SourceChip
                    key={i}
                    source={s}
                    index={i}
                    id={`${msg.id}-s-${i}`}
                    expanded={expandedSources.has(`${msg.id}-s-${i}`)}
                    onToggle={onToggleSource}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-[10px] text-[#999] dark:text-[#555]">
            {formatTimestamp(msg.timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
