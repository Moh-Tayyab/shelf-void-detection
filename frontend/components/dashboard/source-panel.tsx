'use client';

import { useState, useRef } from 'react';
import { Play, Upload, Image as ImageIcon, RefreshCw, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type SessionEntry, formatRelativeTime } from '@/hooks/use-session-history';
import { formatBytes } from '@/lib/utils';

export interface ImageMeta {
  label: string;
  dimensions: string;
  size: string;
}

const IDEAL_CONFIDENCE = 0.35;

interface SourcePanelProps {
  onProcess: () => void;
  isProcessing: boolean;
  confidence: number;
  overlap: number;
  metric: 'area' | 'count';
  onConfidenceChange: (v: number) => void;
  onOverlapChange: (v: number) => void;
  onMetricChange: (v: 'area' | 'count') => void;
  imageUrl: string | null;
  imageMeta: ImageMeta;
  onImageSelect: (file: File) => void;
  onClearImage: () => void;
  sessions?: SessionEntry[];
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
  imageUrl,
  imageMeta,
  onImageSelect,
  onClearImage,
  sessions = [],
}: SourcePanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => fileInputRef.current?.click();

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPEG, PNG, WebP, etc.).');
      return;
    }
    onImageSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <aside
      aria-label="Source and detection settings"
      className="flex flex-col gap-0 shrink-0 w-full md:w-[240px] md:min-w-[240px] bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl overflow-hidden"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-label text-[var(--text-tertiary)]">SOURCE</h2>
        <div
          className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/[0.12] border border-blue-500/20"
          aria-hidden="true"
        >
          <span className="text-label text-[var(--blue-accent)] text-[9px]">#1</span>
        </div>
      </div>

      {/* Image source block */}
      <div className="p-4 flex flex-col gap-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={openPicker}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            aria-label={imageUrl ? 'Change shelf image' : 'Upload shelf image'}
            className="shrink-0 rounded-md overflow-hidden relative cursor-pointer transition-all duration-150 flex items-center justify-center w-[52px] h-[36px]"
            style={{
              border: isDragOver ? '1px solid var(--blue-accent)' : '1px solid var(--border-default)',
              background: 'var(--surface-2)',
              boxShadow: isDragOver ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
            }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Shelf source preview" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                {imageMeta.label}
              </span>
              <div className="flex items-center gap-1">
                {imageUrl && (
                  <button
                    type="button"
                    onClick={onClearImage}
                    aria-label="Remove image"
                    className="w-4 h-4 rounded flex items-center justify-center transition-colors duration-150 hover:bg-white/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={openPicker}
                  className="text-label shrink-0 transition-colors hover:opacity-80 text-[var(--blue-accent)] text-[10px] !tracking-normal !normal-case font-medium"
                >
                  change
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-label text-[9.5px]">{imageMeta.dimensions}</span>
              <span className="text-label text-[9.5px]">{imageMeta.size}</span>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      {/* Controls */}
      <TooltipProvider delayDuration={400}>
        <div className="flex flex-col gap-5 p-4 border-b border-[var(--border-subtle)]">
          {/* Confidence */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label id="conf-label" htmlFor="conf-slider" className="text-label">Confidence</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="w-3 h-3 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-help" aria-label="About Confidence">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-relaxed">
                    Minimum certainty for a detection to be shown. Lower values increase recall but also false positives.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-mono-num tabular-nums text-[11px] font-medium text-[var(--text-primary)]" aria-hidden="true">
                {confidence.toFixed(2)}
              </span>
            </div>
            <div className="relative">
              <Slider
                id="conf-slider"
                aria-labelledby="conf-label"
                min={0} max={1} step={0.01}
                value={[confidence]}
                onValueChange={([v]) => onConfidenceChange(v)}
                className="w-full"
              />
              {/* Ideal breakpoint marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
                style={{ left: `${IDEAL_CONFIDENCE * 100}%` }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-400/60 shadow-sm shadow-amber-400/30 cursor-help" aria-label={`Ideal confidence: ${IDEAL_CONFIDENCE.toFixed(2)}`} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px]">
                    Ideal breakpoint: <span className="font-mono">{IDEAL_CONFIDENCE.toFixed(2)}</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Overlap IoU */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label id="overlap-label" htmlFor="overlap-slider" className="text-label">Overlap (IoU)</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="w-3 h-3 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-help" aria-label="About Overlap IoU">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-relaxed">
                    Intersection over Union — the NMS threshold for merging overlapping boxes. Higher values keep more boxes (may show duplicates), lower values deduplicate more aggressively.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-mono-num tabular-nums text-[11px] font-medium text-[var(--text-primary)]" aria-hidden="true">
                {overlap.toFixed(2)}
              </span>
            </div>
            <Slider
              id="overlap-slider"
              aria-labelledby="overlap-label"
              min={0} max={1} step={0.01}
              value={[overlap]}
              onValueChange={([v]) => onOverlapChange(v)}
              className="w-full"
            />
          </div>

          {/* Metric toggle */}
          <div className="flex flex-col gap-2" role="group" aria-label="Metric selection">
            <span className="text-label">Metric</span>
            <div className="flex rounded-md p-0.5 w-full bg-white/[0.04] border border-[var(--border-default)]">
              {(['area', 'count'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={metric === m}
                  onClick={() => onMetricChange(m)}
                  className={`flex-1 rounded py-1 text-[11px] font-medium transition-all duration-150 ${
                    metric === m
                      ? 'bg-blue-500/20 text-[var(--blue-accent)] border border-blue-500/30'
                      : 'bg-transparent text-[var(--text-secondary)] border border-transparent'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Process button */}
      <div className="p-4">
        <button
          type="button"
          onClick={onProcess}
          disabled={isProcessing}
          aria-busy={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden hover:brightness-110 disabled:cursor-not-allowed"
          style={{
            background: isProcessing ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.8)',
            color: 'white',
            border: '1px solid rgba(59,130,246,0.4)',
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
        <h2 className="text-label mb-2 text-[var(--text-tertiary)]">RECENT SESSIONS</h2>
        {sessions.length === 0 ? (
          <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
            No sessions yet — process an image to see results here.
          </p>
        ) : (
          sessions.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between px-2.5 py-2 rounded-md text-[var(--text-secondary)]"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3 h-3 shrink-0 text-[var(--text-tertiary)]" />
                <span className="text-[11px]">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-tertiary)]">{s.detections}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{formatRelativeTime(s.time)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
