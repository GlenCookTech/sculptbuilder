'use client';

import { useState } from 'react';
import type { Track, Exercise } from '@/types';
import { MUSCLES, COUNTS, trackColor, trackEmoji } from '@/lib/constants';
import { v4 as uuid } from 'uuid';

interface TrackEditorProps {
  track: Track;
  trackIndex: number;
  totalTracks: number;
  onChange: (track: Track) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onAIGenerate: (action: string) => void;
}

export default function TrackEditor({
  track,
  trackIndex,
  totalTracks,
  onChange,
  onDelete,
  onMove,
  onAIGenerate,
}: TrackEditorProps) {
  const [newExName, setNewExName] = useState('');
  const [newExCounts, setNewExCounts] = useState(COUNTS[2]); // default 32 counts

  const color = trackColor(trackIndex);
  const emoji = trackEmoji(trackIndex);

  function updateField<K extends keyof Track>(field: K, value: Track[K]) {
    onChange({ ...track, [field]: value });
  }

  function toggleMuscle(muscle: string) {
    const muscles = track.muscles.includes(muscle)
      ? track.muscles.filter((m) => m !== muscle)
      : [...track.muscles, muscle];
    updateField('muscles', muscles);
  }

  function updateExercise(index: number, updates: Partial<Exercise>) {
    const exercises = track.exercises.map((ex, i) =>
      i === index ? { ...ex, ...updates } : ex
    );
    updateField('exercises', exercises);
  }

  function removeExercise(index: number) {
    updateField(
      'exercises',
      track.exercises.filter((_, i) => i !== index)
    );
  }

  function addExercise() {
    const name = newExName.trim();
    if (!name) return;
    const ex: Exercise = {
      id: uuid(),
      name,
      counts: newExCounts,
      position: track.exercises.length,
    };
    updateField('exercises', [...track.exercises, ex]);
    setNewExName('');
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= track.exercises.length) return;
    const exercises = [...track.exercises];
    [exercises[index], exercises[newIndex]] = [exercises[newIndex], exercises[index]];
    updateField('exercises', exercises.map((ex, i) => ({ ...ex, position: i })));
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-4 sm:pb-5 border-b border-border flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: color.bg,
              color: color.dot,
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {emoji}
          </div>
          <input
            value={track.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="bg-transparent border-none outline-none text-lg sm:text-[22px] font-bold text-text w-full min-w-0 sm:min-w-[200px] placeholder:text-text3"
            style={{ fontFamily: 'Syne, sans-serif' }}
            placeholder="Track name…"
          />
        </div>
        <div className="flex gap-2 shrink-0 items-center">
          <button
            onClick={() => onAIGenerate('suggest_exercises')}
            className="flex-1 sm:flex-none px-3.5 py-2.5 sm:py-[7px] rounded-md text-xs font-medium border border-border2 text-text2 hover:bg-surface2 hover:text-text transition-all whitespace-nowrap min-h-[44px] sm:min-h-0"
          >
            AI Suggest
          </button>
          <button
            onClick={() => onAIGenerate('improve_notes')}
            className="flex-1 sm:flex-none px-3.5 py-2.5 sm:py-[7px] rounded-md text-xs font-medium border border-border2 text-text2 hover:bg-surface2 hover:text-text transition-all whitespace-nowrap min-h-[44px] sm:min-h-0"
          >
            AI Notes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-5 sm:py-7">
        {/* Muscle groups */}
        <div className="mb-7">
          <div className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-2.5">
            Muscle groups
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLES.map((m) => {
              const on = track.muscles.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMuscle(m)}
                  className={`px-3 py-2 sm:py-1 rounded-full text-xs border transition-all select-none min-h-[36px] sm:min-h-0 ${
                    on
                      ? 'border-transparent'
                      : 'border-border2 bg-surface text-text3 hover:border-white/25 hover:text-text2'
                  }`}
                  style={
                    on
                      ? {
                          background: color.bg,
                          color: color.dot,
                          borderColor: `${color.dot}40`,
                        }
                      : undefined
                  }
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises */}
        <div className="mb-7">
          <div className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-2.5">
            Exercises
          </div>
          <div className="border border-border rounded-[10px] overflow-hidden">
            {/* Table header - hidden on mobile */}
            <div className="hidden sm:grid bg-surface border-b border-border select-none"
              style={{ gridTemplateColumns: '32px 1fr 120px 40px' }}
            >
              <div />
              <div className="px-3.5 py-2 text-[10px] font-medium text-text3 uppercase tracking-wide">
                Exercise
              </div>
              <div className="px-3.5 py-2 text-[10px] font-medium text-text3 uppercase tracking-wide text-right">
                Counts
              </div>
              <div />
            </div>

            {/* Exercise rows */}
            {track.exercises.map((ex, ei) => (
              <div
                key={ex.id}
                className="flex flex-col sm:grid border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors"
                style={{ gridTemplateColumns: '32px 1fr 120px 40px' }}
              >
                {/* Mobile layout */}
                <div className="sm:hidden p-3 flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    {ei > 0 && (
                      <button
                        onClick={() => moveExercise(ei, -1)}
                        className="text-text3 hover:text-text text-xs p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        &#9650;
                      </button>
                    )}
                    {ei < track.exercises.length - 1 && (
                      <button
                        onClick={() => moveExercise(ei, 1)}
                        className="text-text3 hover:text-text text-xs p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        &#9660;
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={ex.name}
                      onChange={(e) => updateExercise(ei, { name: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-sm text-text mb-1"
                    />
                    <select
                      value={ex.counts}
                      onChange={(e) => updateExercise(ei, { counts: e.target.value })}
                      className="bg-surface2 border border-border2 rounded px-2 py-1 text-xs text-text2 cursor-pointer"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {COUNTS.map((c) => (
                        <option key={c} value={c} className="bg-surface2">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeExercise(ei)}
                    className="text-text3 hover:text-red text-sm transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    &#10005;
                  </button>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:flex items-center justify-center px-1.5">
                  <div className="flex flex-col">
                    {ei > 0 && (
                      <button
                        onClick={() => moveExercise(ei, -1)}
                        className="text-text3 hover:text-text text-[8px] leading-none p-0.5"
                      >
                        &#9650;
                      </button>
                    )}
                    {ei < track.exercises.length - 1 && (
                      <button
                        onClick={() => moveExercise(ei, 1)}
                        className="text-text3 hover:text-text text-[8px] leading-none p-0.5"
                      >
                        &#9660;
                      </button>
                    )}
                  </div>
                </div>
                <input
                  value={ex.name}
                  onChange={(e) => updateExercise(ei, { name: e.target.value })}
                  className="hidden sm:block w-full bg-transparent border-none outline-none px-3.5 py-2.5 text-[13px] text-text"
                />
                <select
                  value={ex.counts}
                  onChange={(e) => updateExercise(ei, { counts: e.target.value })}
                  className="hidden sm:block bg-transparent border-none outline-none px-1.5 py-2.5 text-xs text-text2 text-right cursor-pointer appearance-none"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {COUNTS.map((c) => (
                    <option key={c} value={c} className="bg-surface2">
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeExercise(ei)}
                  className="hidden sm:flex items-center justify-center text-text3 hover:text-red text-sm transition-colors"
                >
                  &#10005;
                </button>
              </div>
            ))}

            {track.exercises.length === 0 && (
              <div className="px-3.5 py-6 text-center text-text3 text-xs">
                No exercises yet. Add one below or use AI Suggest.
              </div>
            )}
          </div>

          {/* Add exercise row */}
          <div className="flex flex-col sm:flex-row gap-2 mt-2.5">
            <input
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExercise()}
              placeholder="Add exercise…"
              className="flex-1 bg-surface border border-border2 rounded-md px-3 py-3 sm:py-2 text-[13px] text-text outline-none focus:border-white/30 transition-colors placeholder:text-text3"
            />
            <div className="flex gap-2">
              <select
                value={newExCounts}
                onChange={(e) => setNewExCounts(e.target.value)}
                className="flex-1 sm:flex-none bg-surface border border-border2 rounded-md px-2.5 py-3 sm:py-2 text-xs text-text2 outline-none cursor-pointer"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {COUNTS.map((c) => (
                  <option key={c} value={c} className="bg-surface2">
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={addExercise}
                className="px-4 py-3 sm:py-2 bg-surface2 border border-border2 rounded-md text-xs font-medium text-text2 hover:text-text hover:border-white/25 transition-all whitespace-nowrap min-h-[48px] sm:min-h-0"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="mb-7">
          <div className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-2.5">
            Duration
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={track.duration}
              onChange={(e) => updateField('duration', parseInt(e.target.value))}
              className="flex-1 h-[3px] bg-surface3 rounded-sm outline-none cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-[1.2] [&::-webkit-slider-thumb]:transition-transform"
            />
            <span
              className="text-sm font-medium text-text min-w-[52px] text-right"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {track.duration} min
            </span>
          </div>
        </div>

        {/* Coaching notes */}
        <div className="mb-7">
          <div className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-2.5">
            Coaching notes
          </div>
          <textarea
            value={track.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Add coaching cues, weight guidance, modifications…"
            className="w-full bg-surface border border-border2 rounded-md px-3.5 py-2.5 text-[13px] text-text outline-none resize-y min-h-[72px] leading-relaxed focus:border-white/30 transition-colors placeholder:text-text3"
          />
        </div>

        {/* Track actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={onDelete}
            className="px-3.5 py-2.5 sm:py-[7px] rounded-md text-xs font-medium border border-border2 text-text2 hover:border-red hover:text-red hover:bg-red-dim transition-all min-h-[44px] sm:min-h-0"
          >
            Delete track
          </button>
          {trackIndex > 0 && (
            <button
              onClick={() => onMove(-1)}
              className="px-3.5 py-2.5 sm:py-[7px] rounded-md text-xs font-medium border border-border2 text-text2 hover:bg-surface2 hover:text-text transition-all min-h-[44px] sm:min-h-0"
            >
              &uarr; Move up
            </button>
          )}
          {trackIndex < totalTracks - 1 && (
            <button
              onClick={() => onMove(1)}
              className="px-3.5 py-2.5 sm:py-[7px] rounded-md text-xs font-medium border border-border2 text-text2 hover:bg-surface2 hover:text-text transition-all min-h-[44px] sm:min-h-0"
            >
              &darr; Move down
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
