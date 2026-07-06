'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Package, BoxSelect, Layers } from 'lucide-react';

interface OccupancyBreakdownProps {
  metric: 'area' | 'count';
  occupiedPct: number;
  vacantPct: number;
  slotsDetected: number;
  occupiedBoxes: number;
  vacantBoxes: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div
        className="px-3 py-2 rounded-lg"
        style={{
          background: 'rgba(9,13,22,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <p className="text-xs font-semibold" style={{ color: d.payload.color }}>
          {d.name}: {d.value.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function OccupancyBreakdown({
  metric,
  occupiedPct,
  vacantPct,
  slotsDetected,
  occupiedBoxes,
  vacantBoxes,
}: OccupancyBreakdownProps) {
  const data = [
    { name: 'Occupied', value: occupiedPct, color: '#10b981' },
    { name: 'Vacant',   value: vacantPct,   color: '#ef4444' },
  ];

  return (
    <div
      className="flex flex-col"
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
          OCCUPANCY BREAKDOWN
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-label" style={{ color: 'var(--text-tertiary)' }}>by</span>
          <span
            className="text-label"
            style={{ color: 'var(--text-secondary)', textTransform: 'none', fontSize: '10px' }}
          >
            shelf {metric}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row">
        {/* Left: Donut chart */}
        <div
          className="flex flex-col items-center justify-center p-6 shrink-0"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', minWidth: '200px' }}
        >
          <div className="relative" style={{ width: '160px', height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={76}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  dataKey="value"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={i === 0 ? 1 : 0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="font-mono-num font-bold"
                style={{ fontSize: '22px', color: 'var(--text-primary)', lineHeight: 1 }}
              >
                {occupiedPct.toFixed(1)}%
              </span>
              <span className="text-label mt-1" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>
                OCCUPIED
              </span>
            </div>
          </div>
        </div>

        {/* Right: Legend + trend */}
        <div className="flex-1 flex flex-col">
          {/* Legend rows */}
          <div
            className="flex flex-col gap-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Occupied row */}
            <div
              className="flex items-center justify-between px-5 py-4 transition-colors duration-150"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Occupied</p>
                    <p className="text-label" style={{ color: 'var(--text-tertiary)', fontSize: '10px', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}>
                      stocked facings
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                <span
                  className="font-mono-num font-bold tabular-nums"
                  style={{ fontSize: '18px', color: '#10b981' }}
                >
                  {occupiedPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Vacant row */}
            <div
              className="flex items-center justify-between px-5 py-4 transition-colors duration-150"
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Vacant</p>
                    <p className="text-label" style={{ color: 'var(--text-tertiary)', fontSize: '10px', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}>
                      empty / out-of-stock
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                <span
                  className="font-mono-num font-bold tabular-nums"
                  style={{ fontSize: '18px', color: '#ef4444' }}
                >
                  {vacantPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.04)' }}>
            {[
              { value: slotsDetected, label: 'Slots detected', icon: <Layers className="w-3 h-3" />, color: 'var(--text-primary)' },
              { value: occupiedBoxes, label: 'Occupied boxes', icon: <Package className="w-3 h-3" />, color: '#10b981' },
              { value: vacantBoxes,   label: 'Vacant boxes',   icon: <BoxSelect className="w-3 h-3" />, color: '#ef4444' },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 p-4 transition-colors duration-150"
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {stat.icon}
                </div>
                <span
                  className="font-mono-num font-bold tabular-nums"
                  style={{ fontSize: '22px', color: stat.color, lineHeight: 1 }}
                >
                  {stat.value}
                </span>
                <span className="text-label mt-1" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, fontSize: '10px' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div
        className="px-5 py-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
      >
        <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Headline = area occupancy (Σ occupied box area ÷ Σ total box area). Toggle Count for slot-based occupancy {(occupiedBoxes / slotsDetected * 100).toFixed(1)}%, less perspective-sensitive.
        </p>
      </div>
    </div>
  );
}
