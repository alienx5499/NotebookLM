'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/ui/landing-page';
import { useSession } from '@/hooks/useSession';

export default function Home() {
  const router = useRouter();
  const { createSession } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 85));
      }, 300);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) throw new Error('Upload failed');
        const result = await response.json();

        await new Promise((r) => setTimeout(r, 400));

        // Create session and navigate to it
        const session = createSession();

        // Store file info and auto-start message in sessionStorage for the chat page
        sessionStorage.setItem(
          'pending-file',
          JSON.stringify({
            sessionId: session.id,
            fileName: result.fileName,
            chunksCreated: result.chunksCreated,
          }),
        );

        router.push(`/chat/${session.id}`);
      } catch {
        alert('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [router, createSession],
  );

  return (
    <LandingPage
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      onFileSelect={handleFileUpload}
    />
  );
}
