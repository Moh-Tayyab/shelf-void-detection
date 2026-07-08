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
      <div className="px-3 py-2 rounded-lg bg-[var(--surface-0)]/96 border border-white/10 backdrop-blur-[8px]">
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
    { name: 'Occupied', value: occupiedPct, color: 'var(--color-occupied)' },
    { name: 'Vacant',   value: vacantPct,   color: 'var(--color-vacant)' },
  ];

  const countPct = slotsDetected > 0
    ? (occupiedBoxes / slotsDetected) * 100
    : 0;

  const chartAriaLabel = `Occupancy breakdown: ${occupiedPct.toFixed(1)} percent occupied, ${vacantPct.toFixed(1)} percent vacant, ${slotsDetected} slots detected.`;

  return (
    <section
      aria-label="Occupancy breakdown"
      className="flex flex-col bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--border-subtle)]">
        <h2 className="text-label text-[var(--text-tertiary)]">OCCUPANCY BREAKDOWN</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-label text-[var(--text-tertiary)]">by</span>
          <span className="text-label text-[var(--text-secondary)] !tracking-normal !normal-case text-[10px]">
            shelf {metric}
          </span>
        </div>
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" role="status" aria-live="polite">
        {slotsDetected === 0
          ? 'No detection data yet. Upload a shelf image and run detection to see occupancy results.'
          : `${slotsDetected} slots detected. ${occupiedPct.toFixed(1)}% occupied (${occupiedBoxes} boxes), ${vacantPct.toFixed(1)}% vacant (${vacantBoxes} boxes). Processing time not available in this view.`
        }
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row">
        {/* Donut chart */}
        <div className="flex flex-col items-center justify-center p-6 shrink-0 border-b md:border-b-0 md:border-r border-[var(--border-subtle)]" style={{ minWidth: '200px' }}>
          <div className="relative w-[160px] h-[160px]" role="img" aria-label={chartAriaLabel}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={54} outerRadius={76}
                  startAngle={90} endAngle={-270}
                  stroke="none" dataKey="value"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={i === 0 ? 1 : 0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono-num font-bold text-[22px] text-[var(--text-primary)] leading-none">
                {occupiedPct.toFixed(1)}%
              </span>
              <span className="text-label mt-1 text-[var(--text-tertiary)] text-[9px]">OCCUPIED</span>
            </div>
          </div>
        </div>

        {/* Legend + stats */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col gap-0 border-b border-[var(--border-subtle)]">
            {/* Occupied row */}
            <div className="flex items-center justify-between px-5 py-4 transition-colors duration-150 hover:bg-[var(--color-success)]/[0.04] border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[var(--color-success)] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Occupied</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] normal-case tracking-normal font-normal">stocked facings</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--color-success)]" />
                <span className="font-mono-num font-bold tabular-nums text-[18px] text-[var(--color-success)]">
                  {occupiedPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Vacant row */}
            <div className="flex items-center justify-between px-5 py-4 transition-colors duration-150 hover:bg-[var(--color-danger)]/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[var(--color-danger)] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Vacant</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] normal-case tracking-normal font-normal">empty / out-of-stock</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                <span className="font-mono-num font-bold tabular-nums text-[18px] text-[var(--color-danger)]">
                  {vacantPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 divide-x border-t border-[var(--border-subtle)]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {[
              { value: slotsDetected, label: 'Slots detected', icon: <Layers className="w-3 h-3" />, color: 'text-[var(--text-primary)]' },
              { value: occupiedBoxes, label: 'Occupied boxes', icon: <Package className="w-3 h-3" />, color: 'text-[var(--color-success)]' },
              { value: vacantBoxes,   label: 'Vacant boxes',   icon: <BoxSelect className="w-3 h-3" />, color: 'text-[var(--color-danger)]' },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 p-4 transition-colors duration-150 hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-1.5 mb-1 text-[var(--text-tertiary)]">
                  {stat.icon}
                </div>
                <span className={`font-mono-num font-bold tabular-nums text-[22px] leading-none ${stat.color}`}>
                  {stat.value}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] normal-case tracking-normal font-normal mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
          Headline = area occupancy (Σ occupied box area ÷ Σ total box area). Toggle Count for slot-based occupancy {countPct.toFixed(1)}%, less perspective-sensitive.
        </p>
      </div>
    </section>
  );
}
