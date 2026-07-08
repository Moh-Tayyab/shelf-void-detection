'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SessionEntry {
  id: string;
  label: string;
  time: number; // epoch ms
  detections: number;
}

const STORAGE_KEY = 'rackscan.sessions';
const MAX_ENTRIES = 5;

function readStore(): SessionEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(entries: SessionEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

/**
 * Persistent read-only session history backed by localStorage. Each successful
 * detection is recorded via `addSession`; the list is capped at MAX_ENTRIES.
 * Images themselves are not persisted (too large), so entries are informational.
 */
export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  useEffect(() => {
    setSessions(readStore());
  }, []);

  const addSession = useCallback((entry: Omit<SessionEntry, 'id' | 'time'>) => {
    setSessions(prev => {
      const next: SessionEntry[] = [
        { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, time: Date.now() },
        ...prev,
      ].slice(0, MAX_ENTRIES);
      writeStore(next);
      return next;
    });
  }, []);

  return { sessions, addSession };
}

export function formatRelativeTime(time: number): string {
  const diff = Date.now() - time;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
