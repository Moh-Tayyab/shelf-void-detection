'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { TopNav } from '@/components/dashboard/top-nav';
import { SourcePanel, type ImageMeta } from '@/components/dashboard/source-panel';
import { DetectionOutput } from '@/components/dashboard/detection-output';
import { OccupancyBreakdown } from '@/components/dashboard/occupancy-breakdown';
import {
  detectImageAll,
  MODEL_KEYS,
  type ModelKey,
  type ModelResult,
  type ModelStatus,
} from '@/lib/api';
import { useSessionHistory } from '@/hooks/use-session-history';
import { formatBytes } from '@/lib/utils';

export default function Home() {
  const [confidence, setConfidence] = useState(0.35);
  const [overlap, setOverlap] = useState(0.45);
  const [metric, setMetric] = useState<'area' | 'count'>('area');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta>({ label: 'No image selected', dimensions: '—', size: '—' });
  const [error, setError] = useState<string | null>(null);
  const { sessions, addSession } = useSessionHistory();

  const [results, setResults] = useState<Record<ModelKey, ModelResult | null>>({
    occupancy: null, partial: null, arrangement: null,
  });
  const [statusByModel, setStatusByModel] = useState<Record<ModelKey, ModelStatus>>({
    occupancy: 'idle', partial: 'idle', arrangement: 'idle',
  });
  const [view, setView] = useState<ModelKey>('occupancy');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentResult = results[view];
  const boxes = currentResult?.detections ?? [];
  const detectionCount = currentResult?.stats?.detectionCount ?? 0;
  const processingTime = currentResult?.stats?.processingTime ?? null;

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleClearImage = useCallback(() => {
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageFile(null);
    setImageUrl(null);
    setImageMeta({ label: 'No image selected', dimensions: '—', size: '—' });
    setResults({ occupancy: null, partial: null, arrangement: null });
    setStatusByModel({ occupancy: 'idle', partial: 'idle', arrangement: 'idle' });
    setError(null);
  }, [imageUrl]);

  const handleImageSelect = useCallback((file: File) => {
    setError(null);
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImageUrl(url);
    setImageMeta({
      label: file.name,
      dimensions: '—',
      size: formatBytes(file.size),
    });
    setResults({ occupancy: null, partial: null, arrangement: null });
  }, [imageUrl]);

  const handleProcess = useCallback(async () => {
    if (isProcessing) return;
    if (!imageFile) {
      setError('Please upload a shelf image first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults({ occupancy: null, partial: null, arrangement: null });
    setStatusByModel({ occupancy: 'loading', partial: 'loading', arrangement: 'loading' });

    const opts = { confidence, overlap };

    try {
      const batchResult = await detectImageAll(imageFile, opts);

      const newResults: Record<ModelKey, ModelResult | null> = {
        occupancy: null, partial: null, arrangement: null,
      };
      const newStatus: Record<ModelKey, ModelStatus> = {
        occupancy: 'idle', partial: 'idle', arrangement: 'idle',
      };
      let totalDetections = 0;

      for (const key of MODEL_KEYS) {
        const result = batchResult[key];
        if (result?.available) {
          newResults[key] = result;
          newStatus[key] = 'done';
          totalDetections += result.stats.detectionCount;
        } else if (result) {
          newResults[key] = result;
          newStatus[key] = 'unavailable';
        } else {
          newStatus[key] = 'error';
        }
      }

      setResults(newResults);
      setStatusByModel(newStatus);

      if (totalDetections > 0 && imageFile) {
        addSession({ label: imageFile.name, detections: totalDetections });
      }

      if (totalDetections > 0) {
        toast.success(`Analysis complete — ${totalDetections} total detections`);
      }

      const occ = batchResult.occupancy;
      if (occ?.image.width && occ.image.height) {
        setImageMeta(m => ({
          ...m,
          dimensions: `${occ.image.width} × ${occ.image.height}`,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
      setStatusByModel({ occupancy: 'error', partial: 'error', arrangement: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, imageFile, confidence, overlap, addSession]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--surface-0)]">
      <h1 className="sr-only">RackScan — Shelf Occupancy Inspection</h1>
      <TopNav processingTime={processingTime} />

      <main className="flex-1 flex flex-col gap-4 p-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
          <SourcePanel
            onProcess={handleProcess}
            isProcessing={isProcessing}
            confidence={confidence}
            overlap={overlap}
            metric={metric}
            onConfidenceChange={setConfidence}
            onOverlapChange={setOverlap}
            onMetricChange={setMetric}
            imageUrl={imageUrl}
            imageMeta={imageMeta}
            onImageSelect={handleImageSelect}
            onClearImage={handleClearImage}
            sessions={sessions}
          />

          <div className="flex flex-col flex-1 min-h-0">
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-2 px-3 py-2 rounded-md text-xs bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-red-300"
              >
                {error}
              </div>
            )}
            <DetectionOutput
              isProcessing={isProcessing}
              detectionCount={detectionCount}
              processingTime={processingTime}
              imageUrl={imageUrl}
              boxes={boxes}
              view={view}
              statusByModel={statusByModel}
              onViewChange={setView}
              onImageSelect={handleImageSelect}
              onClearImage={handleClearImage}
            />
          </div>
        </div>

        {view === 'occupancy' && (
          <OccupancyBreakdown
            metric={metric}
            occupiedPct={results.occupancy?.stats?.occupiedPct ?? 0}
            vacantPct={results.occupancy?.stats?.vacantPct ?? 0}
            slotsDetected={results.occupancy?.stats?.slotsDetected ?? 0}
            occupiedBoxes={results.occupancy?.stats?.occupiedBoxes ?? 0}
            vacantBoxes={results.occupancy?.stats?.vacantBoxes ?? 0}
          />
        )}
      </main>
    </div>
  );
}
