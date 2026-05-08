'use client';

import * as React from 'react';
import { Send, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const PRIMARY = 'oklch(0.55 0.21 285)';

export function PromptInputBox({ onSend, isLoading, placeholder, className }: PromptInputBoxProps) {
  const [input, setInput] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      onSend?.(input.trim(), files);
      setInput('');
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((f) => f.size <= 10 * 1024 * 1024);
    setFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter((f) => f.size <= 10 * 1024 * 1024);
    setFiles((prev) => [...prev, ...validFiles]);
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const canSend = (input.trim().length > 0 || files.length > 0) && !isLoading;

  return (
    <div
      className={`relative w-full rounded-2xl border bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 ${isDragging ? 'border-white/30 ring-2 ring-white/10' : 'border-white/10'} ${className || ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex flex-wrap gap-2"
          >
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/80"
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 rounded-full p-0.5 hover:bg-white/10"
                >
                  <X className="h-3 w-3 text-white/50" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3">
        {/* Left toolbar */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => document.getElementById('file-input')?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            title="Upload files"
          >
            <Upload className="h-4 w-4" />
          </button>
        </div>

        {/* Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask about your document...'}
          className="min-h-[24px] max-h-[240px] flex-1 resize-none bg-transparent text-sm text-white placeholder-white/20 outline-none"
          rows={1}
          disabled={isLoading}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
            canSend
              ? 'bg-primary text-white hover:opacity-90 active:scale-95'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
          style={canSend ? { boxShadow: `0 0 20px ${PRIMARY}40, 0 0 40px ${PRIMARY}20` } : {}}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      <input
        id="file-input"
        type="file"
        multiple
        accept=".pdf,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
