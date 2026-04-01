'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import type { Routine, Track, Exercise } from '@/types';
import { getRoutine, saveFullRoutine, getUser } from '@/lib/supabase-helpers';
import { exportRoutineDocx } from '@/lib/export-docx';
import TrackSidebar from '@/components/TrackSidebar';
import TrackEditor from '@/components/TrackEditor';
import AIModal from '@/components/AIModal';

type AIAction = 'generate_routine' | 'generate_track' | 'suggest_exercises' | 'improve_notes';

export default function RoutineEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routineId = params.id;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiModal, setAiModal] = useState<AIAction | null>(null);
  const [toast, setToast] = useState('');

  function showToast(msg: string, duration = 2500) {
    setToast(msg);
    setTimeout(() => setToast(''), duration);
  }

  const loadRoutine = useCallback(async () => {
    try {
      const user = await getUser();
      if (!user) {
        router.push('/');
        return;
      }
      const data = await getRoutine(routineId);
      if (!data) {
        showToast('Routine not found');
        router.push('/');
        return;
      }
      setRoutine(data);
    } catch (err) {
      console.error('Failed to load routine:', err);
      showToast('Failed to load routine');
    } finally {
      setLoading(false);
    }
  }, [routineId, router]);

  useEffect(() => {
    loadRoutine();
  }, [loadRoutine]);

  async function handleSave() {
    if (!routine) return;
    setSaving(true);
    try {
      await saveFullRoutine(routine);
      showToast('Saved');
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    if (!routine) return;
    exportRoutineDocx(routine);
    showToast('Downloading…');
  }

  function updateTrack(index: number, updated: Track) {
    if (!routine) return;
    const tracks = routine.tracks.map((t, i) => (i === index ? updated : t));
    setRoutine({ ...routine, tracks });
  }

  function addTrack() {
    if (!routine) return;
    const newTrack: Track = {
      id: uuid(),
      name: 'New track',
      duration: 5,
      muscles: [],
      exercises: [],
      notes: '',
      position: routine.tracks.length,
    };
    setRoutine({ ...routine, tracks: [...routine.tracks, newTrack] });
    setActiveIndex(routine.tracks.length);
  }

  function deleteTrack(index: number) {
    if (!routine) return;
    if (routine.tracks.length <= 1) {
      showToast('Need at least one track');
      return;
    }
    const tracks = routine.tracks
      .filter((_, i) => i !== index)
      .map((t, i) => ({ ...t, position: i }));
    setRoutine({ ...routine, tracks });
    if (activeIndex >= tracks.length) {
      setActiveIndex(tracks.length - 1);
    }
  }

  function moveTrack(index: number, direction: -1 | 1) {
    if (!routine) return;
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= routine.tracks.length) return;
    const tracks = [...routine.tracks];
    [tracks[index], tracks[newIdx]] = [tracks[newIdx], tracks[index]];
    const reordered = tracks.map((t, i) => ({ ...t, position: i }));
    setRoutine({ ...routine, tracks: reordered });
    setActiveIndex(newIdx);
  }

  function handleAIResult(action: AIAction, data: Record<string, unknown>) {
    if (!routine) return;

    if (action === 'generate_routine') {
      const aiTracks = (data.tracks as Array<Record<string, unknown>>).map(
        (t, i): Track => ({
          id: uuid(),
          name: (t.name as string) || `Track ${i + 1}`,
          duration: (t.duration as number) || 5,
          muscles: (t.muscles as string[]) || [],
          exercises: ((t.exercises as Array<Record<string, unknown>>) || []).map(
            (e, j): Exercise => ({
              id: uuid(),
              name: (e.name as string) || '',
              counts: (e.counts as string) || '32 counts',
              position: j,
            })
          ),
          notes: (t.notes as string) || '',
          position: i,
        })
      );
      const name = (data.name as string) || routine.name;
      setRoutine({ ...routine, name, tracks: aiTracks });
      setActiveIndex(0);
      showToast('Routine generated');
    } else if (action === 'generate_track') {
      const t = data as Record<string, unknown>;
      const newTrack: Track = {
        id: uuid(),
        name: (t.name as string) || 'AI Track',
        duration: (t.duration as number) || 5,
        muscles: (t.muscles as string[]) || [],
        exercises: ((t.exercises as Array<Record<string, unknown>>) || []).map(
          (e, j): Exercise => ({
            id: uuid(),
            name: (e.name as string) || '',
            counts: (e.counts as string) || '32 counts',
            position: j,
          })
        ),
        notes: (t.notes as string) || '',
        position: routine.tracks.length,
      };
      setRoutine({ ...routine, tracks: [...routine.tracks, newTrack] });
      setActiveIndex(routine.tracks.length);
      showToast('Track generated');
    } else if (action === 'suggest_exercises') {
      const suggested = ((data.exercises as Array<Record<string, unknown>>) || []).map(
        (e, j): Exercise => ({
          id: uuid(),
          name: (e.name as string) || '',
          counts: (e.counts as string) || '32 counts',
          position: routine.tracks[activeIndex].exercises.length + j,
        })
      );
      const track = routine.tracks[activeIndex];
      const updated: Track = {
        ...track,
        exercises: [...track.exercises, ...suggested],
      };
      updateTrack(activeIndex, updated);
      showToast(`${suggested.length} exercises added`);
    } else if (action === 'improve_notes') {
      const notes = (data.notes as string) || '';
      const track = routine.tracks[activeIndex];
      updateTrack(activeIndex, { ...track, notes });
      showToast('Notes updated');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-text3 text-sm">Loading routine…</p>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-text3 text-sm">Routine not found</p>
      </div>
    );
  }

  const activeTrack = routine.tracks[activeIndex];

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <TrackSidebar
        tracks={routine.tracks}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
        onAddTrack={addTrack}
        onExport={handleExport}
        onBack={() => router.push('/')}
        routineName={routine.name}
        onNameChange={(name) => setRoutine({ ...routine, name })}
        saving={saving}
        onSave={handleSave}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top toolbar */}
        <div className="px-8 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiModal('generate_routine')}
              className="px-3.5 py-[7px] rounded-md text-xs font-medium bg-accent-dim text-accent-text border border-accent/20 hover:border-accent/40 transition-all"
            >
              AI Generate Routine
            </button>
            <button
              onClick={() => setAiModal('generate_track')}
              className="px-3.5 py-[7px] rounded-md text-xs font-medium bg-accent-dim text-accent-text border border-accent/20 hover:border-accent/40 transition-all"
            >
              AI Generate Track
            </button>
          </div>
          <div className="text-xs text-text3">
            {routine.tracks.length} tracks &middot;{' '}
            {routine.tracks.reduce((s, t) => s + t.duration, 0)} min
          </div>
        </div>

        {/* Editor area */}
        {routine.tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text3">
            <div className="text-5xl">🏋️</div>
            <div className="text-lg text-text2" style={{ fontFamily: 'Syne, sans-serif' }}>
              No tracks yet
            </div>
            <div className="text-sm">Add a track to get started</div>
            <button
              onClick={addTrack}
              className="mt-2 px-5 py-2.5 rounded-md text-sm font-medium bg-accent text-bg hover:brightness-110 transition-all"
            >
              + Add track
            </button>
          </div>
        ) : activeTrack ? (
          <TrackEditor
            track={activeTrack}
            trackIndex={activeIndex}
            totalTracks={routine.tracks.length}
            onChange={(t) => updateTrack(activeIndex, t)}
            onDelete={() => deleteTrack(activeIndex)}
            onMove={(dir) => moveTrack(activeIndex, dir)}
            onAIGenerate={(action) => setAiModal(action as AIAction)}
          />
        ) : null}
      </main>

      {/* AI Modal */}
      {aiModal && (
        <AIModal
          action={aiModal}
          onClose={() => setAiModal(null)}
          onResult={handleAIResult}
          context={
            activeTrack
              ? {
                  trackName: activeTrack.name,
                  muscles: activeTrack.muscles,
                  exercises: activeTrack.exercises,
                  currentNotes: activeTrack.notes,
                  totalMinutes: routine.tracks.reduce((s, t) => s + t.duration, 0),
                }
              : undefined
          }
        />
      )}

      {/* Toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface2 border border-border2 rounded-[10px] px-5 py-3 text-sm text-text whitespace-nowrap z-[999] transition-all duration-250 pointer-events-none ${
          toast
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2.5'
        }`}
      >
        {toast}
      </div>
    </div>
  );
}
