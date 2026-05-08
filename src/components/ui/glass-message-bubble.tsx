'use client';

import { cn } from '@/lib/utils';

interface GlassMessageBubbleProps {
  children: React.ReactNode;
  className?: string;
  userBubble?: boolean;
}

export function GlassMessageBubble({
  children,
  className,
  userBubble = false,
}: GlassMessageBubbleProps) {
  return (
    <div
      className={cn(
        'rounded-[1.25rem] p-5 transition-all duration-300',
        userBubble ? 'glass-user glass-hover' : 'glass glass-hover',
        className,
      )}
    >
      {children}
    </div>
  );
}
