'use client';

import { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import type { BoundingBox, BoxType, ModelKey, ModelStatus } from '@/lib/api';
import { MODEL_KEYS } from '@/lib/api';

const COLOR_BY_TYPE: Record<BoxType, { stroke: string; fill: string; glowId: string; label: string }> = {
  occupied:    { stroke: 'var(--color-occupied)',    fill: 'rgba(34,197,94,0.85)',    glowId: 'glow-occupied',    label: 'occ' },
  vacant:      { stroke: 'var(--color-vacant)',      fill: 'rgba(239,68,68,0.85)',    glowId: 'glow-vacant',      label: 'vac' },
  partial:     { stroke: 'var(--color-partial)',     fill: 'rgba(245,158,11,0.85)',   glowId: 'glow-partial',     label: 'prtl' },
  misarranged: { stroke: 'var(--color-arrangement)', fill: 'rgba(168,85,247,0.85)',   glowId: 'glow-arrangement', label: 'mis' },
};

const STATUS_LABEL: Record<ModelStatus, { symbol: string; className: string }> = {
  idle:         { symbol: '○', className: 'text-[var(--text-tertiary)]' },
  loading:      { symbol: '◌', className: 'text-[var(--blue-accent)] animate-pulse' },
  done:         { symbol: '●', className: 'text-[var(--color-success)]' },
  error:        { symbol: '✕', className: 'text-[var(--color-danger)]' },
  unavailable:  { symbol: '—', className: 'text-[var(--text-tertiary)]' },
};

const MODEL_LABEL: Record<ModelKey, string> = {
  occupancy:    'Occupancy',
  partial:      'Partial',
  arrangement:  'Arrangement',
};

interface DetectionOutputProps {
  isProcessing: boolean;
  detectionCount: number;
  processingTime: number | null;
  imageUrl: string | null;
  boxes: BoundingBox[];
  view: ModelKey;
  statusByModel: Record<ModelKey, ModelStatus>;
  onViewChange: (v: ModelKey) => void;
  onImageSelect: (file: File) => void;
  onClearImage: () => void;
}

export function DetectionOutput({
  isProcessing,
  detectionCount,
  processingTime,
  imageUrl,
  boxes,
  view,
  statusByModel,
  onViewChange,
  onImageSelect,
  onClearImage,
}: DetectionOutputProps) {
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'occupied' | 'vacant'>('all');
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

  const visibleBoxes = boxes.filter(
    b => view !== 'occupancy' || filterType === 'all' || b.type === filterType
  );

  /* ── Canvas export ─────────────────────────────────────────────────── */
  const handleDownload = useCallback(() => {
    if (!imageUrl || visibleBoxes.length === 0) {
      toast.warning('Upload an image and run detection before downloading.');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = natW;
      canvas.height = natH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, natW, natH);

      const FONT = `${Math.round(natH * 0.022)}px monospace`;
      const LINE_W = Math.max(2, Math.round(natH * 0.003));

      visibleBoxes.forEach(box => {
        const x = (box.x / 100) * natW;
        const y = (box.y / 100) * natH;
        const w = (box.w / 100) * natW;
        const h = (box.h / 100) * natH;
        const color = COLOR_BY_TYPE[box.type];
        const strokeColor = color.stroke;
        const fillColor = color.fill;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = LINE_W;
        ctx.strokeRect(x, y, w, h);

        const label = `${color.label} ${box.confidence.toFixed(2)}`;
        ctx.font = FONT;
        const textW = ctx.measureText(label).width + 8;
        const textH = natH * 0.028;
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y - textH - 2, textW, textH, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 4, y - 4);
      });

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rackscan-annotated.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Annotated image downloaded.');
      }, 'image/png');
    };

    img.onerror = () => toast.error('Failed to load image for export.');
    img.src = imageUrl;
  }, [imageUrl, visibleBoxes]);

  const isViewLoading = statusByModel[view] === 'loading';
  const isViewDone = statusByModel[view] === 'done';

  return (
    <div className="flex flex-col flex-1 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--border-subtle)]">
        <h2 className="text-label text-[var(--text-tertiary)]">DETECTION OUTPUT</h2>
        <div className="flex items-center gap-4">
          {/* View toggle */}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => { if (v) onViewChange(v as ModelKey); }}
            aria-label="Select detection view"
          >
            {MODEL_KEYS.map(key => (
              <ToggleGroupItem
                key={key}
                value={key}
                aria-label={`Show ${MODEL_LABEL[key]} detections`}
                className="px-2 py-0.5 rounded text-[10px] font-medium data-[state=on]:bg-white/[0.08] data-[state=on]:text-[var(--text-primary)] data-[state=off]:bg-transparent data-[state=off]:text-[var(--text-tertiary)] h-auto"
              >
                {MODEL_LABEL[key]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Sub-filter chips — only for occupancy */}
          {view === 'occupancy' && (
            <>
              <div className="flex items-center gap-1" role="group" aria-label="Filter detections by type">
                {(['all', 'occupied', 'vacant'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={filterType === f}
                    onClick={() => setFilterType(f)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all duration-150 ${
                      filterType === f
                        ? 'bg-white/[0.08] text-[var(--text-primary)]'
                        : 'bg-transparent text-[var(--text-tertiary)]'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="w-px h-3.5 bg-[var(--color-panel-divider)]" />
            </>
          )}

          <div className="flex items-center gap-1">
            <span className="font-mono-num text-xs font-semibold text-[var(--text-primary)]">
              {detectionCount}
            </span>
            <span className="text-label text-[var(--text-tertiary)]">detections</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono-num text-xs font-medium text-[var(--text-secondary)]">
              {processingTime != null ? `${processingTime} ms` : '—'}
            </span>
          </div>

          <div className="w-px h-3.5 bg-[var(--color-panel-divider)]" />

          {/* Toolbar */}
          <div className="flex items-center gap-0.5" role="group" aria-label="Image zoom controls">
            <button type="button" aria-label="Zoom in"
              onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-150 hover-surface text-[var(--text-tertiary)]">
              <ZoomIn className="w-3 h-3" />
            </button>
            <button type="button" aria-label="Zoom out"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-150 hover-surface text-[var(--text-tertiary)]">
              <ZoomOut className="w-3 h-3" />
            </button>
            <button type="button" aria-label="Reset zoom"
              onClick={() => setZoom(1)}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-150 hover-surface text-[var(--text-tertiary)]">
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              aria-label="Download annotated image"
              title="Download annotated PNG"
              onClick={handleDownload}
              disabled={isProcessing || !imageUrl || visibleBoxes.length === 0}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-150 hover-surface disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-tertiary)]"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Status row */}
      <div
        className="flex items-center gap-3 px-4 py-1.5 border-b border-[var(--border-subtle)] bg-white/[0.015]"
        aria-live="polite"
      >
        {MODEL_KEYS.map(key => {
          const st = statusByModel[key];
          const s = STATUS_LABEL[st];
          return (
            <span key={key} className="flex items-center gap-1 text-[10px]">
              <span className={s.className}>{s.symbol}</span>
              <span className="text-[var(--text-tertiary)]">{MODEL_LABEL[key]}</span>
            </span>
          );
        })}
      </div>

      {/* Image viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#060a12]" style={{ minHeight: 0 }}>
        {!imageUrl ? (
          <button
            type="button"
            onClick={openPicker}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            aria-label={isDragOver ? 'Drop image to upload' : 'Upload shelf image, or drag and drop'}
            className={`flex flex-col items-center gap-4 rounded-xl px-10 py-8 cursor-pointer transition-all duration-150 group border ${
              isDragOver
                ? 'bg-blue-500/[0.08] border-[var(--blue-accent)]'
                : 'bg-transparent border-[var(--border-default)]'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-150 group-hover:scale-105 border ${
              isDragOver
                ? 'bg-blue-500/[0.12] border-blue-500/40'
                : 'bg-white/[0.04] border-white/[0.12]'
            }`}>
              <Upload className={`w-6 h-6 transition-colors duration-150 ${isDragOver ? 'text-[var(--blue-accent)]' : 'text-[var(--text-tertiary)]'}`} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {isDragOver ? 'Drop image to upload' : 'Click to upload shelf image'}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                or drag &amp; drop here
              </span>
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
          </button>
        ) : (
          <>
            {isViewLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#060a12]/70 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Running {MODEL_LABEL[view]} inference...
                  </span>
                </div>
              </div>
            )}

            <div
              className="relative"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
              }}
            >
              <img
                src={imageUrl}
                alt="Shelf detection"
                className="block w-full max-w-[900px] h-auto"
                style={{
                  filter: isViewLoading ? 'brightness(0.5)' : 'brightness(1)',
                  transition: 'filter 0.3s ease',
                }}
                draggable={false}
              />

              {isViewDone && visibleBoxes.length > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ pointerEvents: 'none' }}
                >
                  <defs>
                    <filter id="glow-occupied" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-vacant" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-partial" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-arrangement" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  {visibleBoxes.map(box => {
                    const color = COLOR_BY_TYPE[box.type];
                    const isHovered = hoveredBox === box.id;
                    const ariaLabel = `${box.type} slot, confidence ${box.confidence.toFixed(2)}${box.label ? `, class ${box.label}` : ''}`;
                    return (
                      <g key={box.id}>
                        <rect
                          x={box.x} y={box.y} width={box.w} height={box.h}
                          fill={isHovered ? (color.fill.replace('0.85', '0.12')) : 'none'}
                          stroke={color.stroke}
                          strokeWidth={isHovered ? '0.4' : '0.25'}
                          filter={isHovered ? `url(${color.glowId})` : undefined}
                          tabIndex={0}
                          role="button"
                          aria-label={ariaLabel}
                          style={{ pointerEvents: 'visiblePainted', cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none' }}
                          onMouseEnter={() => setHoveredBox(box.id)}
                          onMouseLeave={() => setHoveredBox(null)}
                          onFocus={() => setHoveredBox(box.id)}
                          onBlur={() => setHoveredBox(null)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setHoveredBox(hoveredBox === box.id ? null : box.id);
                            }
                          }}
                        />
                        <rect
                          x={box.x} y={box.y - 2.5}
                          width={box.confidence < 0.9 ? 6 : 6.5} height={2.2}
                          fill={color.fill}
                          rx="0.3"
                        />
                        <text
                          x={box.x + 0.4} y={box.y - 0.9}
                          fill="white" fontSize="1.5" fontWeight="600" fontFamily="monospace"
                          style={{ pointerEvents: 'none' }}
                        >
                          {color.label} {box.confidence.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {hoveredBox !== null && (() => {
              const box = boxes.find(b => b.id === hoveredBox);
              if (!box) return null;
              const color = COLOR_BY_TYPE[box.type];
              return (
                <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-md bg-[var(--surface-0)]/95 border border-white/10 backdrop-blur-[8px] z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.stroke }} />
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {box.type.charAt(0).toUpperCase() + box.type.slice(1)}
                      {box.label && ` — ${box.label}`}
                    </span>
                    <span className="text-label text-[var(--text-tertiary)]">
                      conf {box.confidence.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Cancel button */}
            <button
              type="button"
              onClick={onClearImage}
              aria-label="Remove image"
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 hover:bg-white/10 bg-black/40 text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Corner marks */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-white/20" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/20" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/20" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-white/20" />
          </>
        )}
      </div>
    </div>
  );
}
