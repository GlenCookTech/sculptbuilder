export const TRACK_COLORS = [
  { dot: '#fbbf24', bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  { dot: '#a78bfa', bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
  { dot: '#f87171', bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
  { dot: '#22d3ee', bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
  { dot: '#fb923c', bg: 'rgba(251,146,60,0.15)', text: '#fb923c' },
  { dot: '#2dd4bf', bg: 'rgba(45,212,191,0.15)', text: '#2dd4bf' },
];

export const MUSCLES = [
  'Biceps', 'Triceps', 'Shoulders', 'Back', 'Chest', 'Legs', 'Core',
];

export const COUNTS = [
  'singles',
  '1x3',
  '2x2',
  '3x1',
  '4x4',
  '8 counts',
  '16 counts',
  '32 counts',
  '2x32',
  '3x32',
  '4x32',
  '2, 4x4 then 2, 3x1',
  '2, 4x4 then 2, 2x2',
  '4x4 then singles',
  '2x2 then 1x3',
];

export const TRACK_EMOJIS = ['🌅', '💪', '🦵', '🏋️', '🔥', '🧘', '⚡', '🎯'];

export function trackColor(index: number) {
  return TRACK_COLORS[index % TRACK_COLORS.length];
}

export function trackEmoji(index: number) {
  return TRACK_EMOJIS[index % TRACK_EMOJIS.length];
}
