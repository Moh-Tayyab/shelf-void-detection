'use client';

import { useEffect, useState } from 'react';
import { checkHealth, getModelInfo, deriveModelLabel } from '@/lib/api';

export interface ModelStatus {
  ready: boolean;
  loading: boolean;
  device: string | null;
  modelLabel: string | null;
}

/**
 * Fetches the backend model + health info once on mount and reports a
 * truthful status for the top-nav badge. If either request fails the badge
 * shows "offline" instead of pretending the model is ready.
 */
export function useModelInfo(): ModelStatus {
  const [status, setStatus] = useState<ModelStatus>({
    ready: false,
    loading: true,
    device: null,
    modelLabel: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [health, info] = await Promise.all([checkHealth(), getModelInfo()]);
        if (cancelled) return;
        setStatus({
          ready: health.status === 'ok',
          loading: false,
          device: health.device || info.device,
          modelLabel: deriveModelLabel(info.model_path),
        });
      } catch {
        if (cancelled) return;
        setStatus({ ready: false, loading: false, device: null, modelLabel: null });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
