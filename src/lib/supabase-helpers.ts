import { supabase } from './supabase';
import type { Routine, RoutineSummary, Track, Exercise } from '@/types';
import { v4 as uuid } from 'uuid';

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Routines ─────────────────────────────────────────────────────────────────

export async function listRoutines(): Promise<RoutineSummary[]> {
  const { data, error } = await supabase
    .from('routine_summaries')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const { data: routine, error: rErr } = await supabase
    .from('routines')
    .select('*')
    .eq('id', id)
    .single();

  if (rErr) throw rErr;
  if (!routine) return null;

  const { data: tracks, error: tErr } = await supabase
    .from('tracks')
    .select('*')
    .eq('routine_id', id)
    .order('position');

  if (tErr) throw tErr;

  const trackIds = (tracks ?? []).map((t: Track) => t.id);

  let exercises: Exercise[] = [];
  if (trackIds.length > 0) {
    const { data: exData, error: eErr } = await supabase
      .from('exercises')
      .select('*')
      .in('track_id', trackIds)
      .order('position');

    if (eErr) throw eErr;
    exercises = exData ?? [];
  }

  const fullTracks: Track[] = (tracks ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    exercises: exercises.filter((e: unknown) => (e as Record<string, unknown>).track_id === t.id),
  })) as Track[];

  return { ...routine, tracks: fullTracks } as Routine;
}

export async function createRoutine(userId: string, name: string = 'Untitled Routine'): Promise<string> {
  const routineId = uuid();
  const { error } = await supabase
    .from('routines')
    .insert({ id: routineId, user_id: userId, name });

  if (error) throw error;
  return routineId;
}

export async function updateRoutineName(id: string, name: string) {
  const { error } = await supabase
    .from('routines')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Tracks ───────────────────────────────────────────────────────────────────

export async function upsertTrack(routineId: string, track: Track) {
  const { error } = await supabase
    .from('tracks')
    .upsert({
      id: track.id,
      routine_id: routineId,
      name: track.name,
      duration: track.duration,
      muscles: track.muscles,
      notes: track.notes,
      position: track.position,
    });

  if (error) throw error;

  // Sync exercises: delete existing, insert current
  await supabase.from('exercises').delete().eq('track_id', track.id);

  if (track.exercises.length > 0) {
    const rows = track.exercises.map((ex, i) => ({
      id: ex.id,
      track_id: track.id,
      name: ex.name,
      counts: ex.counts,
      position: i,
    }));

    const { error: exErr } = await supabase.from('exercises').insert(rows);
    if (exErr) throw exErr;
  }

  // Touch routine updated_at
  await supabase
    .from('routines')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', routineId);
}

export async function deleteTrack(trackId: string, routineId: string) {
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId);

  if (error) throw error;

  await supabase
    .from('routines')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', routineId);
}

// ── Bulk save (save entire routine at once) ──────────────────────────────────

export async function saveFullRoutine(routine: Routine) {
  await updateRoutineName(routine.id, routine.name);

  // Get existing track IDs
  const { data: existingTracks } = await supabase
    .from('tracks')
    .select('id')
    .eq('routine_id', routine.id);

  const currentTrackIds = new Set(routine.tracks.map(t => t.id));
  const toDelete = (existingTracks ?? []).filter((t: { id: string }) => !currentTrackIds.has(t.id));

  // Delete removed tracks
  for (const t of toDelete) {
    await supabase.from('tracks').delete().eq('id', t.id);
  }

  // Upsert all current tracks
  for (const track of routine.tracks) {
    await upsertTrack(routine.id, track);
  }
}
