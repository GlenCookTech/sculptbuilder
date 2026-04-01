'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/supabase-helpers';

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fn = mode === 'signin' ? signIn : signUp;
    const { error: authError } = await fn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.');
      setMode('signin');
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm bg-surface border border-border2 rounded-xl p-8">
        <h1
          className="text-center text-xs font-bold tracking-widest uppercase mb-6"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text3)' }}
        >
          Sculpt Builder
        </h1>

        <h2
          className="text-xl font-bold text-text mb-6"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface2 border border-border2 rounded-md px-3 py-2.5 text-sm text-text outline-none focus:border-white/30"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-surface2 border border-border2 rounded-md px-3 py-2.5 text-sm text-text outline-none focus:border-white/30"
          />

          {error && (
            <p className="text-xs text-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-bg font-medium text-sm py-2.5 rounded-md hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <p className="text-xs text-text3 mt-5 text-center">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="text-accent-text hover:text-accent underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
