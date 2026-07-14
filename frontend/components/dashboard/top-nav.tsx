'use client';

import { Bell, Settings, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useModelInfo, type PerModelStatus } from '@/hooks/use-model-info';
import type { ModelKey } from '@/lib/api';

interface TopNavProps {
  processingTime?: number | null;
}

const MODEL_LABEL: Record<ModelKey, string> = {
  occupancy: 'Occ',
  partial: 'Prt',
  arrangement: 'Arr',
};

function ModelDot({ model, status }: { model: ModelKey; status: PerModelStatus }) {
  const color = status.available
    ? 'bg-[var(--color-success)]'
    : 'bg-[var(--text-tertiary)]';
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full ${color}`}
      title={`${model}: ${status.available ? 'ready' : 'unavailable'}`}
      aria-label={`${model} model ${status.available ? 'ready' : 'unavailable'}`}
    />
  );
}

export function TopNav({ processingTime = null }: TopNavProps) {
  const { ready, loading, device, perModel } = useModelInfo();
  const { theme, setTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-5 h-12 bg-[var(--color-panel-bg)] backdrop-blur-[12px] border-b border-[var(--color-panel-border)]"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-500">
            <div className="w-2.5 h-2.5 rounded-sm bg-white/90" />
          </div>
          <span className="text-sm font-semibold tracking-[0.08em] text-[var(--text-primary)]">
            RACKSCAN
          </span>
        </div>
        <div className="hidden sm:flex items-center px-2 py-0.5 rounded bg-white/[0.04] border border-[var(--color-panel-border)]">
          <span className="text-label text-[var(--text-tertiary)] text-[9px]">
            SHELF OCCUPANCY INSPECTION
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Processing indicator */}
        <div className="hidden md:flex items-center gap-1.5" aria-live="polite">
          <Activity className="w-3 h-3 text-[var(--text-tertiary)]" />
          <span className="font-mono-num text-[10px] text-[var(--text-tertiary)]">
            {processingTime != null ? `${processingTime} ms` : '—'}
          </span>
        </div>

        <div className="hidden md:block w-px h-4 bg-[var(--color-panel-divider)]" />

        {/* Multi-model badge */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]`}
          role="status"
          aria-label={`Models: ${loading ? 'loading' : ready ? perModel.occupancy.available ? 'occupancy ready' : 'occupancy offline' : 'offline'}`}
        >
          {loading ? (
            <span className="text-[10px] text-[var(--text-tertiary)]">Connecting…</span>
          ) : (
            <>
              <span className="flex items-center gap-1">
                {(Object.keys(perModel) as ModelKey[]).map(key => (
                  <ModelDot key={key} model={key} status={perModel[key]} />
                ))}
              </span>
              <div className="w-px h-3 mx-0.5 bg-[var(--color-panel-divider)]" />
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                {device ?? ''}
              </span>
            </>
          )}
        </div>

        <div className="w-px h-4 bg-[var(--color-panel-divider)]" />

        <button
          type="button"
          aria-label="Notifications"
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 hover-surface text-[var(--text-tertiary)]"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 hover-surface text-[var(--text-tertiary)]"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 hover-surface text-[var(--text-tertiary)]"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          aria-label="Account: RS"
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer bg-gradient-to-br from-blue-500 to-emerald-500 text-white"
        >
          RS
        </button>
      </div>
    </header>
  );
}
