'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Message, Session, SessionFile } from '@/types';

function generateId(): string {
  return Math.random().toString(36).slice(2);
}

const STORAGE_KEY = 'notebook-lm-sessions';

interface StoredSession {
  id: string;
  title: string;
  files: SessionFile[];
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

function loadAll(): StoredSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(sessions: StoredSession[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useSession() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(loadAll());
  }, []);

  const createSession = useCallback((): Session => {
    const s: Session = {
      id: generateId(),
      title: 'New conversation',
      files: [],
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = loadAll();
    saveAll([...all, s]);
    setSessions([...sessions, s]);
    return s;
  }, [sessions]);

  const getSession = useCallback((id: string): Session | null => {
    const all = loadAll();
    return all.find((s) => s.id === id) ?? null;
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<Session>) => {
    const all = loadAll();
    const next = all.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
    saveAll(next);
    setSessions(next);
  }, []);

  const addFileToSession = useCallback((sessionId: string, file: SessionFile) => {
    const all = loadAll();
    const next = all.map((s) =>
      s.id === sessionId ? { ...s, files: [...s.files, file], updatedAt: Date.now() } : s,
    );
    saveAll(next);
    setSessions(next);
  }, []);

  const deleteSession = useCallback((id: string) => {
    const all = loadAll();
    const next = all.filter((s) => s.id !== id);
    saveAll(next);
    setSessions(next);
  }, []);

  return { sessions, createSession, getSession, updateSession, addFileToSession, deleteSession };
}
