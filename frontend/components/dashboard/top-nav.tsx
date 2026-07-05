'use client';

import { Cpu, ChevronDown, Bell, Settings, Activity } from 'lucide-react';

export function TopNav() {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-5 h-12"
      style={{
        background: 'rgba(9, 13, 22, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #10b981)' }}>
            <div className="w-2.5 h-2.5 rounded-sm bg-white/90" />
          </div>
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}
          >
            RACKSCAN
          </span>
        </div>
        <div
          className="hidden sm:flex items-center px-2 py-0.5 rounded"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-label" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>
            SHELF OCCUPANCY INSPECTION
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Processing indicator */}
        <div className="hidden md:flex items-center gap-1.5">
          <Activity className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-label" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
            214 ms
          </span>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Model badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all duration-150 hover:opacity-80"
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--green-accent)' }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--green-accent)' }}>
            Model ready
          </span>
          <div className="w-px h-3 mx-0.5" style={{ background: 'rgba(16, 185, 129, 0.3)' }} />
          <span className="text-xs font-mono" style={{ color: 'rgba(16, 185, 129, 0.7)' }}>
            yolova·seg
          </span>
          <ChevronDown className="w-3 h-3 ml-0.5" style={{ color: 'rgba(16, 185, 129, 0.6)' }} />
        </div>

        {/* Divider */}
        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Icon buttons */}
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
        <button
          className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #10b981)',
            color: 'white',
          }}
        >
          RS
        </div>
      </div>
    </header>
  );
}
