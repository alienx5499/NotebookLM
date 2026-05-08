import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'NotebookLM — Ask anything about your documents',
  description: 'Upload any document and ask questions. Powered by AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className={`${geist.variable} font-sans antialiased bg-[#FAFAFA] text-[#1D1D1F]`}>
        {children}
      </body>
    </html>
  );
}
