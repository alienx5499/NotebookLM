import { useState, useCallback } from 'react';
import type { Message } from '@/types';

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || isLoadingResponse) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoadingResponse(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: content.trim() }),
        });
        const result = await response.json();

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.answer,
            sources: result.sources,
            timestamp: Date.now(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'Error. Please try again.',
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoadingResponse(false);
      }
    },
    [sessionId, isLoadingResponse],
  );

  const addAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    setMessages,
    isLoadingResponse,
    sendMessage,
    addAssistantMessage,
    clearMessages,
  };
}
