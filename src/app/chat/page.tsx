'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from '@/hooks/useSession';

/* --- SVG Icons --- */
const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const FileIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

/* --- Time helper --- */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/* --- SessionCard --- */
function SessionCard({
  session,
  onDelete,
  onClick,
}: {
  session: { id: string; title: string; files: { name: string }[]; updatedAt: number };
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const visibleFiles = session.files.slice(0, 3);
  const extraCount = session.files.length - 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => onClick(session.id)}
      className="group relative rounded-[16px] border border-[#1A1A1A] bg-[#141414] p-4 cursor-pointer hover:border-[#C96442] transition-colors"
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        aria-label="Delete session"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#555] opacity-0 group-hover:opacity-100 hover:bg-[#1A1A1A] hover:text-[#C96442] transition-all cursor-pointer"
      >
        <TrashIcon />
      </button>

      {/* Title */}
      <p className="pr-8 font-semibold text-[14px] text-[#EAEAEA] font-heading leading-snug line-clamp-2 mb-3">
        {session.title}
      </p>

      {/* File chips */}
      {session.files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleFiles.map((f) => (
            <span
              key={f.name}
              className="inline-flex items-center gap-1 rounded-full border border-[#1A1A1A] bg-[#0A0A0A] px-2 py-0.5 text-[11px] text-[#888]"
            >
              <FileIcon />
              {f.name}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-[#1A1A1A] bg-[#0A0A0A] px-2 py-0.5 text-[11px] text-[#666]">
              +{extraCount} more
            </span>
          )}
        </div>
      )}

      {/* Time */}
      <p className="text-[11px] text-[#555]">{timeAgo(session.updatedAt)}</p>
    </motion.div>
  );
}

/* --- Empty State --- */
function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <p className="mb-6 text-[15px] text-[#555]">No conversations yet</p>
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 rounded-full border border-[#C96442] bg-[#C96442]/10 px-5 py-2.5 text-[14px] font-semibold text-[#C96442] font-heading hover:bg-[#C96442]/20 transition-colors cursor-pointer"
      >
        <PlusIcon />
        Start a new chat
      </button>
    </motion.div>
  );
}

/* --- Page Inner --- */
function ChatListPageInner() {
  const router = useRouter();
  const { sessions, createSession, deleteSession } = useSession();

  const handleNewChat = () => {
    const session = createSession();
    router.push(`/chat/${session.id}`);
  };

  const handleCardClick = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteSession(id);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-[#1A1A1A] bg-[#0A0A0A]/95 backdrop-blur-xl px-4">
        <div className="mx-auto flex w-full items-center justify-between" style={{ maxWidth: 720 }}>
          <p className="text-[15px] font-semibold text-[#EAEAEA] font-heading">NotebookLM</p>
          <button
            onClick={handleNewChat}
            aria-label="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C96442] bg-[#C96442]/10 text-[#C96442] hover:bg-[#C96442]/20 transition-colors cursor-pointer"
          >
            <PlusIcon />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto" style={{ maxWidth: 720 }}>
          <p className="mb-4 text-[13px] font-semibold text-[#555] font-heading">
            Recent conversations
          </p>

          {sessions.length === 0 ? (
            <EmptyState onNewChat={handleNewChat} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDelete={handleDelete}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* --- Page --- */
function ChatListPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C96442] border-t-transparent" />
    </div>
  );
}

export default function ChatListPage() {
  return (
    <Suspense fallback={<ChatListPageSkeleton />}>
      <ChatListPageInner />
    </Suspense>
  );
}
