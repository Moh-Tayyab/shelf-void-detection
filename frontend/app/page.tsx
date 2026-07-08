'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { TopNav } from '@/components/dashboard/top-nav';
import { SourcePanel, type ImageMeta } from '@/components/dashboard/source-panel';
import { DetectionOutput } from '@/components/dashboard/detection-output';
import { OccupancyBreakdown } from '@/components/dashboard/occupancy-breakdown';
import { detectImage, type BoundingBox } from '@/lib/api';
import { useSessionHistory } from '@/hooks/use-session-history';
import { formatBytes } from '@/lib/utils';

export default function Home() {
  const [confidence, setConfidence] = useState(0.35);
  const [overlap, setOverlap] = useState(0.45);
  const [metric, setMetric] = useState<'area' | 'count'>('area');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [detectionCount, setDetectionCount] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [occupiedPct, setOccupiedPct] = useState(0);
  const [vacantPct, setVacantPct] = useState(0);
  const [slotsDetected, setSlotsDetected] = useState(0);
  const [occupiedBoxes, setOccupiedBoxes] = useState(0);
  const [vacantBoxes, setVacantBoxes] = useState(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<ImageMeta>({ label: 'No image selected', dimensions: '—', size: '—' });
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { sessions, addSession } = useSessionHistory();

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    };
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
    setBoxes([]);
  }, [imageUrl]);

  const handleProcess = useCallback(async () => {
    if (isProcessing) return;
    if (!imageFile) {
      setError('Please upload a shelf image first.');
      return;
    }

    setIsProcessing(true);
    setShowBoxes(false);
    setError(null);

    try {
      const result = await detectImage(imageFile, { confidence, overlap });

      setBoxes(result.detections);
      setDetectionCount(result.stats.detectionCount);
      setProcessingTime(result.stats.processingTime);
      setOccupiedPct(result.stats.occupiedPct);
      setVacantPct(result.stats.vacantPct);
      setSlotsDetected(result.stats.slotsDetected);
      setOccupiedBoxes(result.stats.occupiedBoxes);
      setVacantBoxes(result.stats.vacantBoxes);
      if (result.image.width && result.image.height) {
        setImageMeta(m => ({
          ...m,
          dimensions: `${result.image.width} × ${result.image.height}`,
        }));
      }

      toast.success(`Detected ${result.stats.detectionCount} slots in ${result.stats.processingTime} ms`);
      addSession({ label: imageFile.name, detections: result.stats.detectionCount });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Detection request failed.';
      setError(message);
      setBoxes([]);
      toast.error(message);
    } finally {
      setIsProcessing(false);
      setShowBoxes(true);
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
              showBoxes={showBoxes}
              detectionCount={detectionCount}
              processingTime={processingTime}
              imageUrl={imageUrl}
              boxes={boxes}
              onImageSelect={handleImageSelect}
            />
          </div>
        </div>

        <OccupancyBreakdown
          metric={metric}
          occupiedPct={occupiedPct}
          vacantPct={vacantPct}
          slotsDetected={slotsDetected}
          occupiedBoxes={occupiedBoxes}
          vacantBoxes={vacantBoxes}
        />
      </main>
    </div>
  );
}
