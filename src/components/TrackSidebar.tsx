'use client';

import type { Track } from '@/types';
import { trackColor, trackEmoji } from '@/lib/constants';

interface TrackSidebarProps {
  tracks: Track[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddTrack: () => void;
  onExport: () => void;
  onBack: () => void;
  routineName: string;
  onNameChange: (name: string) => void;
  saving: boolean;
  onSave: () => void;
  onCloseMobile?: () => void;
}

export default function TrackSidebar({
  tracks,
  activeIndex,
  onSelect,
  onAddTrack,
  onExport,
  onBack,
  routineName,
  onNameChange,
  saving,
  onSave,
  onCloseMobile,
}: TrackSidebarProps) {
  const totalMin = tracks.reduce((s, t) => s + t.duration, 0);
  const mm = String(Math.floor(totalMin)).padStart(2, '0');

  return (
    <aside className="w-[280px] sm:w-[260px] shrink-0 bg-surface border-r border-border flex flex-col overflow-hidden h-screen">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="text-[10px] text-text3 uppercase tracking-widest hover:text-text2 transition-colors flex items-center gap-1.5 min-h-[44px] lg:min-h-0"
            style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}
          >
            <span className="text-xs">&larr;</span> Sculpt Builder
          </button>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 -mr-2 text-text3 hover:text-text min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Routine name */}
        <input
          value={routineName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-text border-none outline-none mb-3 placeholder:text-text3"
          style={{ fontFamily: 'Syne, sans-serif' }}
          placeholder="Routine name…"
        />

        {/* Timer block */}
        <div className="bg-surface2 border border-border2 rounded-[10px] p-3.5">
          <div className="text-[10px] text-text3 uppercase tracking-widest mb-1.5">
            Class duration
          </div>
          <div
            className="text-4xl font-medium text-accent leading-none mb-2.5 tracking-tight"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {mm}:00
          </div>

          {/* Track bars */}
          <div className="flex flex-col gap-[5px]">
            {tracks.map((t, i) => {
              const pct = totalMin > 0 ? (t.duration / totalMin) * 100 : 0;
              const color = trackColor(i);
              return (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-text3 w-[52px] shrink-0 truncate">
                    {t.name}
                  </span>
                  <div className="flex-1 h-[3px] bg-surface3 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-[width] duration-300"
                      style={{ width: `${pct.toFixed(1)}%`, background: color.dot }}
                    />
                  </div>
                  <span
                    className="text-[10px] text-text3 w-6 text-right shrink-0"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    {t.duration}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-border flex flex-col gap-2.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-text3 uppercase tracking-wide">Tracks</span>
          <span className="text-[13px] text-text font-medium" style={{ fontFamily: 'DM Mono, monospace' }}>
            {tracks.length}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-text3 uppercase tracking-wide">Exercises</span>
          <span className="text-[13px] text-text font-medium" style={{ fontFamily: 'DM Mono, monospace' }}>
            {tracks.reduce((s, t) => s + t.exercises.length, 0)}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-text3 uppercase tracking-wide">Total</span>
          <span className="text-[13px] text-text font-medium" style={{ fontFamily: 'DM Mono, monospace' }}>
            {totalMin} min
          </span>
        </div>
      </div>

      {/* Track nav */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-[3px]">
        {tracks.map((t, i) => {
          const color = trackColor(i);
          const active = i === activeIndex;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(i)}
              className={`flex items-center gap-2.5 px-3 py-3 sm:py-2 rounded-md cursor-pointer transition-colors border text-left w-full min-h-[48px] sm:min-h-0 ${
                active
                  ? 'bg-surface2 border-border2'
                  : 'border-transparent hover:bg-surface2'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: color.dot }}
              />
              <span
                className={`text-[13px] flex-1 truncate ${
                  active ? 'text-text' : 'text-text2'
                }`}
              >
                {t.name}
              </span>
              <span
                className="text-[11px] text-text3"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {t.duration}m
              </span>
            </button>
          );
        })}

        <button
          onClick={onAddTrack}
          className="flex items-center gap-2 px-3 py-3 sm:py-2 rounded-md border border-dashed border-border2 text-text3 text-xs w-full mt-1 hover:border-accent-text hover:text-accent-text transition-colors min-h-[48px] sm:min-h-0"
        >
          <span>+</span> Add track
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex flex-col gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-md text-[13px] font-medium bg-accent text-bg hover:brightness-110 disabled:opacity-50 transition-all w-full min-h-[48px] sm:min-h-0"
        >
          {saving ? 'Saving…' : 'Save routine'}
        </button>
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-md text-[13px] font-medium text-text2 border border-border2 hover:bg-surface2 hover:text-text transition-all w-full min-h-[48px] sm:min-h-0"
        >
          &darr; Export Word doc
        </button>
      </div>
    </aside>
  );
}
