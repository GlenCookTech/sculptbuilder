'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { listRoutines, createRoutine, deleteRoutine, getUser, signOut } from '@/lib/supabase-helpers';
import type { RoutineSummary } from '@/types';
import type { User } from '@supabase/supabase-js';
import AuthForm from '@/components/AuthForm';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRoutines();
      setRoutines(data);
    } catch (err) {
      console.error('Failed to load routines:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) loadRoutines();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadRoutines();
    });

    return () => subscription.unsubscribe();
  }, [loadRoutines]);

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    try {
      const id = await createRoutine(user.id);
      router.push(`/routine/${id}`);
    } catch (err) {
      console.error('Failed to create routine:', err);
    }
    setCreating(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteRoutine(id);
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete routine:', err);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-text3 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => getUser().then(setUser)} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1
          className="text-xs font-bold tracking-widest uppercase text-text3"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Sculpt Builder
        </h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:block text-xs text-text3">{user.email}</span>
          <button
            onClick={() => signOut().then(() => setUser(null))}
            className="text-xs text-text3 hover:text-text border border-border2 rounded-md px-3 py-1.5 min-h-[36px] transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl font-bold text-text"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            My Routines
          </h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-accent text-bg font-medium text-sm px-5 py-2.5 rounded-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <span>+</span> New Routine
          </button>
        </div>

        {loading ? (
          <p className="text-text3 text-sm">Loading routines...</p>
        ) : routines.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏋️</div>
            <p className="text-text2 text-lg mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              No routines yet
            </p>
            <p className="text-text3 text-sm mb-6">Create your first sculpt class routine</p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-accent text-bg font-medium text-sm px-5 py-2.5 rounded-md hover:brightness-110 disabled:opacity-50 transition-all"
            >
              + Create Routine
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {routines.map((r) => (
              <div
                key={r.id}
                className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4 hover:border-border2 transition-all cursor-pointer group"
                onClick={() => router.push(`/routine/${r.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text truncate">{r.name}</h3>
                  <p className="text-xs text-text3 mt-1">
                    {r.track_count} track{r.track_count !== 1 ? 's' : ''} &middot; {r.total_duration} min &middot; Updated {new Date(r.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.name); }}
                  className="text-text3 hover:text-red text-xs border border-transparent hover:border-red/30 rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-all"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
