'use client';

import { Bell, Settings, Activity, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useModelInfo } from '@/hooks/use-model-info';

interface TopNavProps {
  processingTime?: number | null;
}

export function TopNav({ processingTime = null }: TopNavProps) {
  const { ready, loading, device, modelLabel } = useModelInfo();
  const { theme, setTheme } = useTheme();

  const badge = loading
    ? { color: 'text-[var(--text-tertiary)]', bg: 'bg-white/[0.04]', border: 'border-white/[0.08]', label: 'Connecting…' }
    : ready
    ? { color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]/[0.08]', border: 'border-[var(--color-success)]/20', label: 'Model ready' }
    : { color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger)]/[0.08]', border: 'border-[var(--color-danger)]/20', label: 'Model offline' };

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

        {/* Model badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${badge.bg} border ${badge.border}`}
          role="status"
          aria-label={`Model ${loading ? 'loading' : ready ? 'ready' : 'offline'}${device ? ` on ${device}` : ''}${modelLabel ? `, ${modelLabel}` : ''}`}
        >
          {ready ? (
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${badge.color}`} />
          ) : (
            <AlertCircle className={`w-3 h-3 ${badge.color}`} aria-hidden="true" />
          )}
          <span className={`text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
          {ready && (
            <>
              <div className="w-px h-3 mx-0.5 bg-[var(--color-glow-green)]" />
              <span className="text-xs font-mono text-[var(--color-success)]/75">
                {modelLabel}
                {device ? ` · ${device}` : ''}
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
