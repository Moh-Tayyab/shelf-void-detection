'use client';

import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download, Layers } from 'lucide-react';

interface BoundingBox {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'occupied' | 'vacant';
  confidence: number;
  label?: string;
}

const BOUNDING_BOXES: BoundingBox[] = [
  // Row 1 - top shelf (occupied, dense)
  { id: 1,  x: 1.5,  y: 2.0,  w: 6.5,  h: 14.0, type: 'occupied', confidence: 0.94, label: 'Gaviscon' },
  { id: 2,  x: 8.5,  y: 1.5,  w: 7.0,  h: 14.5, type: 'occupied', confidence: 0.91, label: 'Nexium' },
  { id: 3,  x: 16.0, y: 2.0,  w: 6.0,  h: 14.0, type: 'occupied', confidence: 0.89, label: 'Gaviscon' },
  { id: 4,  x: 22.5, y: 1.5,  w: 7.5,  h: 15.0, type: 'occupied', confidence: 0.92 },
  { id: 5,  x: 30.5, y: 2.0,  w: 6.0,  h: 14.0, type: 'occupied', confidence: 0.87 },
  { id: 6,  x: 37.0, y: 1.5,  w: 8.0,  h: 15.5, type: 'occupied', confidence: 0.93, label: 'Rennie' },
  { id: 7,  x: 45.5, y: 2.0,  w: 7.0,  h: 14.0, type: 'occupied', confidence: 0.88 },
  { id: 8,  x: 53.0, y: 1.5,  w: 6.5,  h: 15.0, type: 'occupied', confidence: 0.91 },
  { id: 9,  x: 60.0, y: 2.0,  w: 7.0,  h: 14.5, type: 'occupied', confidence: 0.85 },
  { id: 10, x: 67.5, y: 1.5,  w: 6.0,  h: 15.0, type: 'occupied', confidence: 0.90 },
  { id: 11, x: 74.0, y: 2.0,  w: 7.5,  h: 14.0, type: 'occupied', confidence: 0.88 },
  { id: 12, x: 82.0, y: 1.5,  w: 6.0,  h: 15.5, type: 'occupied', confidence: 0.86 },
  { id: 13, x: 88.5, y: 2.0,  w: 9.5,  h: 14.0, type: 'occupied', confidence: 0.92 },

  // Row 2 - second shelf
  { id: 14, x: 2.0,  y: 18.0, w: 9.0,  h: 16.0, type: 'occupied', confidence: 0.90, label: 'Rennie' },
  { id: 15, x: 11.5, y: 18.5, w: 10.0, h: 15.5, type: 'occupied', confidence: 0.87, label: 'Nexium' },
  { id: 16, x: 22.0, y: 18.0, w: 9.5,  h: 16.0, type: 'occupied', confidence: 0.93, label: 'Gaviscon' },
  { id: 17, x: 32.0, y: 18.5, w: 9.0,  h: 15.5, type: 'occupied', confidence: 0.89 },
  { id: 18, x: 41.5, y: 18.0, w: 10.0, h: 16.0, type: 'occupied', confidence: 0.91, label: 'Gaviscon' },
  { id: 19, x: 52.0, y: 18.5, w: 9.0,  h: 15.5, type: 'occupied', confidence: 0.86 },
  { id: 20, x: 61.5, y: 18.0, w: 8.5,  h: 16.0, type: 'vacant',   confidence: 0.78 },
  { id: 21, x: 70.5, y: 18.5, w: 9.0,  h: 15.5, type: 'occupied', confidence: 0.88 },
  { id: 22, x: 80.0, y: 18.0, w: 8.0,  h: 16.0, type: 'occupied', confidence: 0.92 },
  { id: 23, x: 88.5, y: 18.5, w: 9.5,  h: 15.5, type: 'occupied', confidence: 0.85 },

  // Row 3 - middle shelf
  { id: 24, x: 1.5,  y: 37.0, w: 10.0, h: 17.0, type: 'occupied', confidence: 0.89 },
  { id: 25, x: 12.0, y: 37.5, w: 9.5,  h: 16.5, type: 'occupied', confidence: 0.91 },
  { id: 26, x: 22.0, y: 37.0, w: 10.0, h: 17.0, type: 'vacant',   confidence: 0.82 },
  { id: 27, x: 32.5, y: 37.5, w: 9.0,  h: 16.5, type: 'occupied', confidence: 0.87 },
  { id: 28, x: 42.0, y: 37.0, w: 10.5, h: 17.0, type: 'occupied', confidence: 0.93 },
  { id: 29, x: 53.0, y: 37.5, w: 9.0,  h: 16.5, type: 'vacant',   confidence: 0.79 },
  { id: 30, x: 62.5, y: 37.0, w: 9.5,  h: 17.0, type: 'occupied', confidence: 0.88 },
  { id: 31, x: 72.5, y: 37.5, w: 9.0,  h: 16.5, type: 'occupied', confidence: 0.90 },
  { id: 32, x: 82.0, y: 37.0, w: 8.5,  h: 17.0, type: 'occupied', confidence: 0.86 },
  { id: 33, x: 91.0, y: 37.5, w: 7.5,  h: 16.5, type: 'occupied', confidence: 0.84 },

  // Row 4 - lower-mid shelf
  { id: 34, x: 2.0,  y: 57.0, w: 10.0, h: 16.0, type: 'vacant',   confidence: 0.81 },
  { id: 35, x: 12.5, y: 57.5, w: 9.5,  h: 15.5, type: 'occupied', confidence: 0.88 },
  { id: 36, x: 22.5, y: 57.0, w: 10.0, h: 16.0, type: 'occupied', confidence: 0.92 },
  { id: 37, x: 33.0, y: 57.5, w: 9.0,  h: 15.5, type: 'occupied', confidence: 0.87 },
  { id: 38, x: 42.5, y: 57.0, w: 9.5,  h: 16.0, type: 'occupied', confidence: 0.91 },
  { id: 39, x: 52.5, y: 57.5, w: 10.0, h: 15.5, type: 'vacant',   confidence: 0.77 },
  { id: 40, x: 63.0, y: 57.0, w: 9.0,  h: 16.0, type: 'occupied', confidence: 0.89 },
  { id: 41, x: 72.5, y: 57.5, w: 9.5,  h: 15.5, type: 'occupied', confidence: 0.85 },
  { id: 42, x: 82.5, y: 57.0, w: 8.5,  h: 16.0, type: 'occupied', confidence: 0.90 },
  { id: 43, x: 91.5, y: 57.5, w: 7.5,  h: 15.5, type: 'vacant',   confidence: 0.83 },

  // Row 5 - bottom shelf
  { id: 44, x: 2.5,  y: 76.0, w: 10.0, h: 18.0, type: 'occupied', confidence: 0.88 },
  { id: 45, x: 13.0, y: 76.5, w: 9.5,  h: 17.5, type: 'occupied', confidence: 0.91 },
  { id: 46, x: 23.0, y: 76.0, w: 10.0, h: 18.0, type: 'vacant',   confidence: 0.80 },
  { id: 47, x: 33.5, y: 76.5, w: 9.0,  h: 17.5, type: 'occupied', confidence: 0.87 },
  { id: 48, x: 43.0, y: 76.0, w: 10.0, h: 18.0, type: 'occupied', confidence: 0.92 },
  { id: 49, x: 53.5, y: 76.5, w: 9.0,  h: 17.5, type: 'occupied', confidence: 0.86 },
  { id: 50, x: 63.0, y: 76.0, w: 9.5,  h: 18.0, type: 'occupied', confidence: 0.89 },
  { id: 51, x: 73.0, y: 76.5, w: 9.0,  h: 17.5, type: 'vacant',   confidence: 0.76 },
  { id: 52, x: 82.5, y: 76.0, w: 8.5,  h: 18.0, type: 'occupied', confidence: 0.90 },
  { id: 53, x: 91.5, y: 76.5, w: 7.5,  h: 17.5, type: 'occupied', confidence: 0.84 },
];

interface DetectionOutputProps {
  isProcessing: boolean;
  showBoxes: boolean;
  detectionCount: number;
  processingTime: number;
}

export function DetectionOutput({
  isProcessing,
  showBoxes,
  detectionCount,
  processingTime,
}: DetectionOutputProps) {
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'occupied' | 'vacant'>('all');

  const visibleBoxes = BOUNDING_BOXES.filter(
    b => filterType === 'all' || b.type === filterType
  );

  return (
    <div
      className="flex flex-col flex-1"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>
          DETECTION OUTPUT
        </span>
        <div className="flex items-center gap-4">
          {/* Filter chips */}
          <div className="flex items-center gap-1">
            {(['all', 'occupied', 'vacant'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className="px-2 py-0.5 rounded text-xs font-medium transition-all duration-150"
                style={{
                  background: filterType === f ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: filterType === f ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontSize: '10px',
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Stats */}
          <div className="flex items-center gap-1">
            <span className="font-mono-num text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {detectionCount}
            </span>
            <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>detections</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono-num text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {processingTime} ms
            </span>
          </div>

          <div className="w-px h-3.5" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Toolbar */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
              className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
              className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              className="w-6 h-6 rounded flex items-center justify-center transition-all duration-150"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Image viewport */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        style={{ background: '#060a12', minHeight: 0 }}
      >
        {isProcessing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(6,10,18,0.7)', backdropFilter: 'blur(2px)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Running inference...</span>
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
            src="https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=900"
            alt="Shelf detection"
            className="block"
            style={{
              width: '100%',
              maxWidth: '900px',
              height: 'auto',
              display: 'block',
              filter: isProcessing ? 'brightness(0.5)' : 'brightness(1)',
              transition: 'filter 0.3s ease',
            }}
            draggable={false}
          />

          {/* SVG bounding boxes overlay */}
          {showBoxes && !isProcessing && (
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ pointerEvents: 'none' }}
            >
              <defs>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {visibleBoxes.map(box => {
                const isOccupied = box.type === 'occupied';
                const color = isOccupied ? '#22c55e' : '#ef4444';
                const isHovered = hoveredBox === box.id;
                return (
                  <g key={box.id}>
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.w}
                      height={box.h}
                      fill={isHovered ? (isOccupied ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : 'none'}
                      stroke={color}
                      strokeWidth={isHovered ? '0.4' : '0.25'}
                      filter={isHovered ? (isOccupied ? 'url(#glow-green)' : 'url(#glow-red)') : undefined}
                      style={{ pointerEvents: 'visiblePainted', cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={() => setHoveredBox(box.id)}
                      onMouseLeave={() => setHoveredBox(null)}
                    />
                    {/* Confidence label */}
                    <rect
                      x={box.x}
                      y={box.y - 2.5}
                      width={box.confidence < 0.9 ? 6 : 6.5}
                      height={2.2}
                      fill={isOccupied ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)'}
                      rx="0.3"
                    />
                    <text
                      x={box.x + 0.4}
                      y={box.y - 0.9}
                      fill="white"
                      fontSize="1.5"
                      fontWeight="600"
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none' }}
                    >
                      {isOccupied ? 'occ' : 'vac'} {box.confidence.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Hovered box tooltip */}
        {hoveredBox !== null && (() => {
          const box = BOUNDING_BOXES.find(b => b.id === hoveredBox);
          if (!box) return null;
          return (
            <div
              className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-md"
              style={{
                background: 'rgba(9,13,22,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                zIndex: 10,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: box.type === 'occupied' ? 'var(--green-accent)' : 'var(--red-accent)' }}
                />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {box.type === 'occupied' ? 'Occupied' : 'Vacant'}
                  {box.label && ` — ${box.label}`}
                </span>
                <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>
                  conf {box.confidence.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Corner brackets */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      </div>
    </div>
  );
}
