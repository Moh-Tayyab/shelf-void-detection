'use client';

import { useState, useCallback, useEffect } from 'react';
import { TopNav } from '@/components/dashboard/top-nav';
import { SourcePanel, type ImageMeta } from '@/components/dashboard/source-panel';
import { DetectionOutput, DEFAULT_BOXES, DEFAULT_IMAGE_URL } from '@/components/dashboard/detection-output';
import { OccupancyBreakdown } from '@/components/dashboard/occupancy-breakdown';
import { detectImage, type BoundingBox } from '@/lib/api';

const INITIAL_STATE = {
  confidence: 0.35,
  overlap: 0.45,
  metric: 'area' as 'area' | 'count',
  isProcessing: false,
  showBoxes: true,
  detectionCount: 103,
  processingTime: 214,
  occupiedPct: 71.6,
  vacantPct: 28.4,
  slotsDetected: 103,
  occupiedBoxes: 84,
  vacantBoxes: 19,
};

const DEFAULT_IMAGE_META: ImageMeta = {
  label: 'shelf_29.jpeg',
  dimensions: '615 × 444',
  size: '186 KB',
};

export default function Home() {
  const [confidence, setConfidence] = useState(INITIAL_STATE.confidence);
  const [overlap, setOverlap] = useState(INITIAL_STATE.overlap);
  const [metric, setMetric] = useState<'area' | 'count'>(INITIAL_STATE.metric);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [detectionCount, setDetectionCount] = useState(INITIAL_STATE.detectionCount);
  const [processingTime, setProcessingTime] = useState(INITIAL_STATE.processingTime);
  const [occupiedPct, setOccupiedPct] = useState(INITIAL_STATE.occupiedPct);
  const [vacantPct, setVacantPct] = useState(INITIAL_STATE.vacantPct);
  const [slotsDetected, setSlotsDetected] = useState(INITIAL_STATE.slotsDetected);
  const [occupiedBoxes, setOccupiedBoxes] = useState(INITIAL_STATE.occupiedBoxes);
  const [vacantBoxes, setVacantBoxes] = useState(INITIAL_STATE.vacantBoxes);

  // Backend-connected state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE_URL);
  const [imageMeta, setImageMeta] = useState<ImageMeta>(DEFAULT_IMAGE_META);
  const [boxes, setBoxes] = useState<BoundingBox[]>(DEFAULT_BOXES);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleImageSelect = useCallback((file: File) => {
    setError(null);
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImageUrl(url);
    setImageMeta({
      label: file.name,
      dimensions: '—',
      size: formatBytes(file.size),
    });
    // Clear previous annotations until the user runs detection
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
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Detection request failed.';
      setError(message);
      setBoxes([]);
    } finally {
      setIsProcessing(false);
      setShowBoxes(true);
    }
  }, [isProcessing, imageFile, confidence, overlap]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface-0)' }}>
      <TopNav />

      <main className="flex-1 flex flex-col gap-4 p-4">
        {/* Main row: sidebar + detection */}
        <div className="flex gap-4 flex-1" style={{ minHeight: 0 }}>
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
          />

          <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
            {error && (
              <div
                className="mb-2 px-3 py-2 rounded-md text-xs"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                }}
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
            />
          </div>
        </div>

        {/* Analytics row */}
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
