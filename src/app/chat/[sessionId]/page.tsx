'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message, Session, SessionFile } from '@/types';
import { useSession } from '@/hooks/useSession';
import { useChat } from '@/hooks/useChat';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { UserBubble } from '@/components/chat/UserBubble';
import { LoadingBubble } from '@/components/chat/LoadingBubble';

/* ─── Icons ──────────────────────────────────────────────── */
function ArrowLeftIcon() {
  return (
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
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon() {
  return (
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
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function FileIcon() {
  return (
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
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

/* ─── Raccoon Welcome ─────────────────────────────────────── */
const SUGGESTIONS = [
  'Summarize the key themes',
  'What are the main arguments?',
  'Explain the conclusions',
  'Compare and contrast the ideas',
];

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function RaccoonWelcome({
  files,
  onSuggestion,
}: {
  files: SessionFile[];
  onSuggestion: (text: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* NotebookLM Logo */}
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#C96442]/10 border border-[#C96442]/20">
        <span className="text-[22px] font-bold font-heading text-[#C96442]">N</span>
      </div>

      <p className="mb-1 text-[17px] font-semibold text-[#EAEAEA] font-heading">
        Ready to explore your sources
      </p>
      <p className="mb-6 text-[14px] text-[#666]">Ask anything about the materials below.</p>

      {files.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {files.map((f) => (
            <span
              key={f.name}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1A1A1A] bg-[#141414] px-3 py-1 text-[12px] text-[#888]"
            >
              <FileIcon />
              {f.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="rounded-full border border-[#1A1A1A] bg-[#141414] px-4 py-2 text-[13px] text-[#888] hover:border-[#C96442] hover:text-[#C96442] transition-colors cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Page Inner ─────────────────────────────────────────── */
function SessionChatInner() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { getSession, addFileToSession, updateSession } = useSession();
  const { messages, setMessages, isLoadingResponse, sendMessage, addAssistantMessage } =
    useChat(sessionId);

  const [inputValue, setInputValue] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<Session | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load session on mount and reload when storage changes
  useEffect(() => {
    const stored = getSession(sessionId);
    setSession(stored ?? null);
  }, [sessionId, getSession]);

  // Auto-start chat when arriving from homepage upload
  useEffect(() => {
    const pendingRaw = sessionStorage.getItem('pending-file');
    if (!pendingRaw) return;
    try {
      const pending = JSON.parse(pendingRaw);
      if (pending.sessionId !== sessionId) return;
      sessionStorage.removeItem('pending-file');

      const fileEntry: SessionFile = {
        name: pending.fileName,
        chunksCreated: pending.chunksCreated,
        uploadedAt: Date.now(),
      };
      addFileToSession(sessionId, fileEntry);

      if (session?.title === 'New conversation') {
        const base = pending.fileName.replace(/\.pdf$/i, '');
        updateSession(sessionId, { title: base });
      }

      addAssistantMessage(
        `I've processed "${pending.fileName}" — ${pending.chunksCreated} chunks indexed. Ask me anything about the content.`,
      );
    } catch {
      /* ignore malformed data */
    }
  }, [sessionId, session, addFileToSession, updateSession, addAssistantMessage]);

  // Restore messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notebook-lm-sessions');
    if (!stored) return;
    try {
      const sessions = JSON.parse(stored);
      const found = sessions.find((s: { id: string }) => s.id === sessionId);
      if (found?.messages) {
        setMessages(found.messages);
      }
    } catch {
      /* ignore */
    }
  }, [sessionId, setMessages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    const stored = localStorage.getItem('notebook-lm-sessions');
    if (!stored) return;
    try {
      const sessions = JSON.parse(stored);
      const next = sessions.map((s: { id: string; messages: Message[] }) =>
        s.id === sessionId ? { ...s, messages } : s,
      );
      localStorage.setItem('notebook-lm-sessions', JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [messages, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingResponse]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleToggleSource = useCallback((id: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = '';
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text && !pendingFile) return;
    setInputValue('');
    setPendingFile(null);

    if (pendingFile) {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', pendingFile);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
          const fileEntry: SessionFile = {
            name: data.fileName,
            chunksCreated: data.chunksCreated,
            uploadedAt: Date.now(),
          };
          addFileToSession(sessionId, fileEntry);

          // Auto-title from first uploaded file
          if (session?.title === 'New conversation') {
            const base = data.fileName.replace(/\.pdf$/i, '');
            updateSession(sessionId, { title: base });
          }

          // Auto-start chat after file upload
          addAssistantMessage(
            `I've processed "${data.fileName}" — ${data.chunksCreated} chunks indexed. Ask me anything about the content.`,
          );
        }
      } finally {
        setIsUploading(false);
      }
    }

    if (text) {
      await sendMessage(text);
    }
  };

  const handleSuggestion = (text: string) => {
    setInputValue(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C96442] border-t-transparent" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A]">
        <p className="mb-4 text-[15px] text-[#888]">Session not found</p>
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-2 rounded-full border border-[#C96442] bg-[#C96442]/10 px-4 py-2 text-[14px] text-[#C96442] font-heading hover:bg-[#C96442]/20 transition-colors cursor-pointer"
        >
          <ArrowLeftIcon />
          Back to chats
        </button>
      </div>
    );
  }

  const hasContent = inputValue.trim().length > 0 || pendingFile !== null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-[#1A1A1A] bg-[#0A0A0A]/95 backdrop-blur-xl px-4">
        <div className="mx-auto flex w-full items-center justify-between" style={{ maxWidth: 800 }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chat')}
              aria-label="Back"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1A1A1A] bg-[#141414] text-[#888] hover:border-[#C96442] hover:text-[#C96442] transition-colors cursor-pointer"
            >
              <ArrowLeftIcon />
            </button>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#EAEAEA] font-heading truncate">
                {session.title}
              </p>
              {session.files.length > 0 && (
                <p className="text-[11px] text-[#555]">
                  {session.files.length} file{session.files.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/chat')}
            aria-label="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#C96442] bg-[#C96442]/10 text-[#C96442] hover:bg-[#C96442]/20 transition-colors cursor-pointer"
          >
            <PlusIcon />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto" style={{ maxWidth: 800 }}>
          {messages.length === 0 ? (
            <RaccoonWelcome files={session.files} onSuggestion={handleSuggestion} />
          ) : (
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => {
                  if (msg.role === 'user') {
                    return (
                      <UserBubble
                        key={msg.id}
                        content={msg.content}
                        timestamp={msg.timestamp}
                        formatTimestamp={formatTime}
                        index={i}
                      />
                    );
                  }
                  return (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      expandedSources={expandedSources}
                      onToggleSource={handleToggleSource}
                      formatTimestamp={formatTime}
                      index={i}
                    />
                  );
                })}
              </AnimatePresence>

              {isLoadingResponse && <LoadingBubble />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Composer */}
      <div className="border-t border-[#1A1A1A] bg-[#0A0A0A] px-4 py-3">
        <div className="mx-auto" style={{ maxWidth: 800 }}>
          {/* Pending file preview */}
          <AnimatePresence>
            {pendingFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-[10px] border border-[#1A1A1A] bg-[#141414] px-3 py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C96442]/10 text-[#C96442]">
                    <FileIcon />
                  </span>
                  <span className="flex-1 text-[13px] text-[#EAEAEA] truncate">
                    {pendingFile.name}
                  </span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#555] hover:text-[#EAEAEA] transition-colors cursor-pointer"
                  >
                    <XIcon />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div className="flex items-end gap-2 rounded-[14px] border border-[#1A1A1A] bg-[#141414] px-3 py-2.5">
            <button
              onClick={handleAttachClick}
              aria-label="Attach file"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#666] hover:text-[#C96442] transition-colors cursor-pointer"
            >
              <AttachIcon />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,text/plain"
              className="hidden"
              onChange={handleFileSelect}
            />

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] text-[#EAEAEA] placeholder-[#444] outline-none leading-relaxed scrollbar-none"
              style={{ minHeight: 24, maxHeight: 160 }}
            />

            <button
              onClick={handleSend}
              disabled={!hasContent || isLoadingResponse || isUploading}
              aria-label="Send"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed"
              style={{
                background:
                  hasContent && !isLoadingResponse && !isUploading ? '#C96442' : '#1A1A1A',
                color: hasContent && !isLoadingResponse && !isUploading ? '#fff' : '#444',
              }}
            >
              {isLoadingResponse || isUploading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <SendIcon />
              )}
            </button>
          </div>

          <p className="mt-1.5 text-center text-[10px] text-[#333]">
            NotebookLM may display inaccurate information.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
function SessionChatSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C96442] border-t-transparent" />
    </div>
  );
}

export default function SessionChatPage() {
  return (
    <Suspense fallback={<SessionChatSkeleton />}>
      <SessionChatInner />
    </Suspense>
  );
}
