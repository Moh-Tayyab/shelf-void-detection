'use client';

import { useState, useRef } from 'react';
import { Play, Upload, ChevronDown, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface SourcePanelProps {
  onProcess: () => void;
  isProcessing: boolean;
  confidence: number;
  overlap: number;
  metric: 'area' | 'count';
  onConfidenceChange: (v: number) => void;
  onOverlapChange: (v: number) => void;
  onMetricChange: (v: 'area' | 'count') => void;
}

export function SourcePanel({
  onProcess,
  isProcessing,
  confidence,
  overlap,
  metric,
  onConfidenceChange,
  onOverlapChange,
  onMetricChange,
}: SourcePanelProps) {
  const [imageLabel] = useState('shelf_29.jpeg');
  const [hoveringProcess, setHoveringProcess] = useState(false);

  return (
    <aside
      className="flex flex-col gap-0 shrink-0"
      style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>SOURCE</span>
        <div
          className="flex items-center justify-center w-5 h-5 rounded"
          style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <span className="text-label" style={{ color: 'var(--blue-accent)', fontSize: '9px' }}>#1</span>
        </div>
      </div>

      {/* Image source block */}
      <div className="p-4 flex flex-col gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start gap-2.5">
          {/* Thumbnail */}
          <div
            className="shrink-0 rounded-md overflow-hidden"
            style={{
              width: '52px',
              height: '36px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'var(--surface-2)',
            }}
          >
            <img
              src="https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=120&h=80&fit=crop"
              alt="Shelf source"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span
                className="text-xs font-medium truncate"
                style={{ color: 'var(--text-primary)', fontSize: '11px' }}
              >
                {imageLabel}
              </span>
              <button
                className="text-label shrink-0 transition-colors hover:opacity-80"
                style={{ color: 'var(--blue-accent)', fontSize: '10px', letterSpacing: '0', textTransform: 'none', fontWeight: 500 }}
              >
                change
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-label" style={{ fontSize: '9.5px' }}>615 × 444</span>
              <span className="text-label" style={{ fontSize: '9.5px' }}>186 KB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-5 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Confidence */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-label">Confidence</span>
            <span
              className="font-mono-num tabular-nums"
              style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}
            >
              {confidence.toFixed(2)}
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[confidence]}
            onValueChange={([v]) => onConfidenceChange(v)}
            className="w-full"
          />
        </div>

        {/* Overlap IoU */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-label">Overlap (IoU)</span>
            <span
              className="font-mono-num tabular-nums"
              style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}
            >
              {overlap.toFixed(2)}
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[overlap]}
            onValueChange={([v]) => onOverlapChange(v)}
            className="w-full"
          />
        </div>

        {/* Metric toggle */}
        <div className="flex flex-col gap-2">
          <span className="text-label">Metric</span>
          <div
            className="flex rounded-md p-0.5 w-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['area', 'count'] as const).map(m => (
              <button
                key={m}
                onClick={() => onMetricChange(m)}
                className="flex-1 rounded py-1 text-xs font-medium transition-all duration-150"
                style={{
                  background: metric === m ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: metric === m ? 'var(--blue-accent)' : 'var(--text-secondary)',
                  border: metric === m ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  fontSize: '11px',
                }}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Process button */}
      <div className="p-4">
        <button
          onClick={onProcess}
          disabled={isProcessing}
          onMouseEnter={() => setHoveringProcess(true)}
          onMouseLeave={() => setHoveringProcess(false)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden"
          style={{
            background: isProcessing
              ? 'rgba(59,130,246,0.3)'
              : hoveringProcess
              ? 'rgba(59,130,246,0.9)'
              : 'rgba(59,130,246,0.8)',
            color: 'white',
            border: '1px solid rgba(59,130,246,0.4)',
            boxShadow: hoveringProcess && !isProcessing
              ? '0 0 20px rgba(59,130,246,0.3)'
              : '0 0 0 rgba(59,130,246,0)',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
          }}
        >
          {isProcessing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white" />
          )}
          <span>{isProcessing ? 'Processing...' : 'Process image'}</span>
        </button>
      </div>

      {/* Session history */}
      <div className="px-4 pb-4 flex flex-col gap-1">
        <span className="text-label mb-2" style={{ color: 'var(--text-tertiary)' }}>RECENT SESSIONS</span>
        {[
          { label: 'shelf_28.jpeg', time: '2m ago', detections: 98 },
          { label: 'shelf_27.jpeg', time: '14m ago', detections: 112 },
          { label: 'shelf_26.jpeg', time: '1h ago', detections: 87 },
        ].map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3 h-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{s.detections}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
