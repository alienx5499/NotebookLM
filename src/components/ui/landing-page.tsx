'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Circle, Upload, Sparkles, Shield, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  isUploading: boolean;
  uploadProgress: number;
  onFileSelect: (file: File) => void;
}

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-white/[0.08]',
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'backdrop-blur-[2px] border-2 border-white/[0.15]',
            'shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]',
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function UploadZone({ isUploading, uploadProgress, onFileSelect }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 transition-all duration-500',
        'hover:border-white/[0.18] hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-black/40',
        'active:scale-[0.98]',
        dragActive && 'border-indigo-500/50 bg-white/[0.06] shadow-2xl shadow-indigo-500/10',
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* Upload overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-2xl bg-black/60 backdrop-blur-xl">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Sparkles className="h-7 w-7 text-white/60" />
            </div>
            <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="white/10" strokeWidth="1.5" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - uploadProgress / 100)}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/80">Processing document...</p>
            <p className="mt-1 text-xs text-white/40">{Math.round(uploadProgress)}%</p>
          </div>
          <div className="h-1 w-32 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 transition-all duration-300',
          'group-hover:scale-110 group-hover:bg-white/10',
        )}
      >
        <Upload
          className={cn(
            'h-6 w-6 text-white/50 transition-all duration-300',
            'group-hover:text-indigo-400 group-hover:-translate-y-0.5',
          )}
        />
      </div>

      <p className="text-base font-medium text-white/70 group-hover:text-white/90 text-center">
        Drop a file here or click to upload
      </p>
      <p className="mt-1.5 text-sm text-white/30 text-center">PDF, TXT, CSV, DOCX</p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.csv,.docx,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function LandingPage({ isUploading, uploadProgress, onFileSelect }: UploadZoneProps) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.15,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    }),
  };

  const features = [
    { icon: Brain, label: 'RAG-powered', color: 'text-indigo-400' },
    { icon: Shield, label: 'Private & secure', color: 'text-rose-400' },
    { icon: Zap, label: 'Instant answers', color: 'text-amber-400' },
  ];

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-rose-500/[0.06] blur-3xl" />

      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ElegantShape
          delay={0.3}
          width={700}
          height={150}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-15%] top-[10%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-8%] top-[65%]"
        />
        <ElegantShape
          delay={0.4}
          width={350}
          height={90}
          rotate={-8}
          gradient="from-violet-500/[0.12]"
          className="left-[5%] bottom-[8%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={55}
          rotate={20}
          gradient="from-amber-500/[0.12]"
          className="right-[18%] top-[8%]"
        />
        <ElegantShape
          delay={0.7}
          width={140}
          height={38}
          rotate={-25}
          gradient="from-cyan-500/[0.12]"
          className="left-[22%] top-[5%]"
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8"
          >
            <Circle className="h-2 w-2 fill-indigo-500/80" />
            <span className="text-sm text-white/50 tracking-wide">AI Document Assistant</span>
          </motion.div>

          {/* Heading */}
          <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Your documents,
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
                deeply understood.
              </span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-lg sm:text-xl text-white/40 leading-relaxed font-light max-w-lg mx-auto mb-12"
          >
            Upload a PDF or text file. Ask anything. Get precise, grounded answers powered by AI.
          </motion.p>

          {/* Upload box */}
          <motion.div custom={3} variants={fadeUpVariants} initial="hidden" animate="visible">
            <UploadZone
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onFileSelect={onFileSelect}
            />
          </motion.div>

          {/* Feature pills */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/40"
              >
                <f.icon className={cn('h-3.5 w-3.5', f.color)} />
                {f.label}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
