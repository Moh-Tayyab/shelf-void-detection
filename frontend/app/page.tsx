'use client';

import { useState, useCallback } from 'react';
import { TopNav } from '@/components/dashboard/top-nav';
import { SourcePanel } from '@/components/dashboard/source-panel';
import { DetectionOutput } from '@/components/dashboard/detection-output';
import { OccupancyBreakdown } from '@/components/dashboard/occupancy-breakdown';

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

  const handleProcess = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowBoxes(false);

    const duration = 800 + Math.random() * 600;

    setTimeout(() => {
      const base = metric === 'area' ? 71.6 : 81.6;
      const confEffect = (confidence - 0.35) * 20;
      const newOccupied = Math.min(Math.max(base + confEffect + (Math.random() * 4 - 2), 55), 92);
      const newVacant = parseFloat((100 - newOccupied).toFixed(1));
      const newDetections = Math.round(90 + confidence * 30 + Math.random() * 10);
      const newSlots = Math.round(newDetections * (1 + Math.random() * 0.05));
      const newOccupiedBoxes = Math.round((newOccupied / 100) * newSlots);
      const newVacantBoxes = newSlots - newOccupiedBoxes;

      setOccupiedPct(parseFloat(newOccupied.toFixed(1)));
      setVacantPct(newVacant);
      setDetectionCount(newDetections);
      setProcessingTime(Math.round(duration));
      setSlotsDetected(newSlots);
      setOccupiedBoxes(newOccupiedBoxes);
      setVacantBoxes(newVacantBoxes);
      setIsProcessing(false);
      setShowBoxes(true);
    }, duration);
  }, [isProcessing, confidence, metric]);

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
          />

          <DetectionOutput
            isProcessing={isProcessing}
            showBoxes={showBoxes}
            detectionCount={detectionCount}
            processingTime={processingTime}
          />
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
