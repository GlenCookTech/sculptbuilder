'use client';

import { useState } from 'react';
import { MUSCLES } from '@/lib/constants';

type AIAction = 'generate_routine' | 'generate_track' | 'suggest_exercises' | 'improve_notes';

interface AIModalProps {
  action: AIAction;
  onClose: () => void;
  onResult: (action: AIAction, data: Record<string, unknown>) => void;
  context?: {
    trackName?: string;
    muscles?: string[];
    exercises?: { name: string }[];
    currentNotes?: string;
    totalMinutes?: number;
  };
}

export default function AIModal({ action, onClose, onResult, context }: AIModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate routine fields
  const [goal, setGoal] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(context?.totalMinutes ?? 45);

  // Generate track fields
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(context?.muscles ?? []);
  const [trackDuration, setTrackDuration] = useState(5);

  // Suggest exercises fields
  const [exerciseCount, setExerciseCount] = useState(3);

  function toggleMuscle(m: string) {
    setSelectedMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    let payload: Record<string, unknown> = {};

    if (action === 'generate_routine') {
      if (!goal.trim()) {
        setError('Enter a class goal.');
        setLoading(false);
        return;
      }
      payload = { goal: goal.trim(), totalMinutes };
    } else if (action === 'generate_track') {
      if (selectedMuscles.length === 0) {
        setError('Select at least one muscle group.');
        setLoading(false);
        return;
      }
      payload = { muscles: selectedMuscles, duration: trackDuration };
    } else if (action === 'suggest_exercises') {
      payload = {
        muscles: context?.muscles ?? [],
        existingExercises: context?.exercises?.map((e) => e.name) ?? [],
        count: exerciseCount,
      };
    } else if (action === 'improve_notes') {
      payload = {
        trackName: context?.trackName ?? '',
        muscles: context?.muscles ?? [],
        exercises: context?.exercises ?? [],
        currentNotes: context?.currentNotes ?? '',
      };
    }

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      onResult(action, data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<AIAction, string> = {
    generate_routine: 'Generate Routine with AI',
    generate_track: 'Generate Track with AI',
    suggest_exercises: 'AI Exercise Suggestions',
    improve_notes: 'AI Coaching Notes',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border2 rounded-t-xl sm:rounded-xl w-full max-w-lg sm:mx-4 shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2
            className="text-base font-bold text-text"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {titles[action]}
          </h2>
          <button
            onClick={onClose}
            className="text-text3 hover:text-text text-lg transition-colors p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            &#10005;
          </button>
        </div>

        {/* Modal body */}
        <div className="px-5 sm:px-6 py-5">
          {action === 'generate_routine' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-1.5 block">
                  Class goal
                </label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., 45-min full body, emphasis on glutes"
                  className="w-full bg-surface2 border border-border2 rounded-md px-3 py-2.5 text-sm text-text outline-none focus:border-white/30 transition-colors placeholder:text-text3"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-1.5 block">
                  Total minutes
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={20}
                    max={75}
                    step={5}
                    value={totalMinutes}
                    onChange={(e) => setTotalMinutes(parseInt(e.target.value))}
                    className="flex-1 h-[3px] bg-surface3 rounded-sm outline-none cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span
                    className="text-sm font-medium text-text min-w-[52px] text-right"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    {totalMinutes} min
                  </span>
                </div>
              </div>
            </div>
          )}

          {action === 'generate_track' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-1.5 block">
                  Target muscles
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MUSCLES.map((m) => {
                    const on = selectedMuscles.includes(m);
                    return (
                      <button
                        key={m}
                        onClick={() => toggleMuscle(m)}
                        className={`px-3 py-2 sm:py-1 rounded-full text-xs border transition-all select-none min-h-[36px] sm:min-h-0 ${
                          on
                            ? 'bg-accent-dim text-accent border-accent/40'
                            : 'border-border2 bg-surface text-text3 hover:border-white/25 hover:text-text2'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-1.5 block">
                  Duration
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={2}
                    max={15}
                    step={1}
                    value={trackDuration}
                    onChange={(e) => setTrackDuration(parseInt(e.target.value))}
                    className="flex-1 h-[3px] bg-surface3 rounded-sm outline-none cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span
                    className="text-sm font-medium text-text min-w-[52px] text-right"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    {trackDuration} min
                  </span>
                </div>
              </div>
            </div>
          )}

          {action === 'suggest_exercises' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text2">
                AI will suggest <strong className="text-text">{exerciseCount}</strong> new exercises
                for <strong className="text-text">{context?.trackName}</strong> targeting{' '}
                <strong className="text-text">{context?.muscles?.join(', ') || 'selected muscles'}</strong>.
              </p>
              <div>
                <label className="text-[10px] font-medium text-text3 uppercase tracking-widest mb-1.5 block">
                  Number of suggestions
                </label>
                <div className="flex gap-2">
                  {[2, 3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setExerciseCount(n)}
                      className={`px-4 py-2.5 sm:py-1.5 rounded-md text-xs font-medium border transition-all min-h-[44px] sm:min-h-0 ${
                        exerciseCount === n
                          ? 'bg-accent-dim text-accent border-accent/40'
                          : 'border-border2 text-text3 hover:text-text2'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {action === 'improve_notes' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text2">
                AI will rewrite the coaching notes for{' '}
                <strong className="text-text">{context?.trackName}</strong> with improved cues,
                tempo guidance, and modifications.
              </p>
              {context?.currentNotes && (
                <div className="bg-surface2 rounded-md px-3 py-2.5 text-xs text-text3 leading-relaxed">
                  <span className="text-text3 font-medium">Current notes: </span>
                  {context.currentNotes}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 px-3 py-2 bg-red-dim border border-red/30 rounded-md text-xs text-red">
              {error}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-5 sm:px-6 py-4 border-t border-border sticky bottom-0 bg-surface">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-3 sm:py-2 rounded-md text-xs font-medium text-text2 border border-border2 hover:bg-surface2 hover:text-text transition-all min-h-[48px] sm:min-h-0"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-3 sm:py-2 rounded-md text-xs font-medium bg-accent text-bg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0"
          >
            {loading && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
            )}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
