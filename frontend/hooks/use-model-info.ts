'use client';

import { useEffect, useState } from 'react';
import { checkHealth, getModelInfo, type ModelKey } from '@/lib/api';

export interface PerModelStatus {
  available: boolean;
  label: string;
}

export interface ModelStatus {
  ready: boolean;
  loading: boolean;
  device: string | null;
  perModel: Record<ModelKey, PerModelStatus>;
}

export function useModelInfo(): ModelStatus {
  const [status, setStatus] = useState<ModelStatus>({
    ready: false,
    loading: true,
    device: null,
    perModel: {
      occupancy: { available: false, label: 'occupancy' },
      partial: { available: false, label: 'partial' },
      arrangement: { available: false, label: 'arrangement' },
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [health, info] = await Promise.all([checkHealth(), getModelInfo()]);
        if (cancelled) return;

        const perModel = {
          occupancy: {
            available: info.models.occupancy?.available ?? false,
            label: info.models.occupancy?.weight?.split('/').pop()?.replace(/\.pt$/i, '') || 'occupancy',
          },
          partial: {
            available: info.models.partial?.available ?? false,
            label: info.models.partial?.weight?.split('/').pop()?.replace(/\.pt$/i, '') || 'partial',
          },
          arrangement: {
            available: info.models.arrangement?.available ?? false,
            label: info.models.arrangement?.weight?.split('/').pop()?.replace(/\.pt$/i, '') || 'arrangement',
          },
        };

        setStatus({
          ready: health.status === 'ok',
          loading: false,
          device: health.device || info.device,
          perModel,
        });
      } catch {
        if (cancelled) return;
        setStatus({
          ready: false,
          loading: false,
          device: null,
          perModel: {
            occupancy: { available: false, label: 'occupancy' },
            partial: { available: false, label: 'partial' },
            arrangement: { available: false, label: 'arrangement' },
          },
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
