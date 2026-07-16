// ── Schedule / time conversion helpers ──────────────────
// Used by AppContext and BlockingSchedulesScreen to convert between
// human-readable UI values and the numeric format the native
// BlockingService expects.

/** "09:00" → 540 */
export function timeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 540 → "09:00" */
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Mon=0 … Sun=6  (matches native ScheduleRule.days) */
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** 'Mon' → 0, 'Tue' → 1, … 'Sun' → 6 */
export function dayLabelToIndex(label) {
  const idx = DAY_LABELS.indexOf(label);
  return idx >= 0 ? idx : -1;
}

/** 0 → 'Mon', 1 → 'Tue', … 6 → 'Sun' */
export function dayIndexToLabel(idx) {
  return DAY_LABELS[idx] ?? '';
}

/** Epoch milliseconds at local midnight today (for getUsageStats). */
export function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Session / gamification constants (unchanged) ────────

export const SESSION_TYPES = [
  { id: 'deep',   label: 'Deep Work',   emoji: '🎯', duration: 25, points: 15 },
  { id: 'light',  label: 'Light Focus', emoji: '💡', duration: 15, points: 8  },
  { id: 'flow',   label: 'Flow State',  emoji: '🌊', duration: 50, points: 25 },
  { id: 'custom', label: 'Custom',      emoji: '⚙️', duration: 25, points: 10 },
];

export const BADGES = [
  { id: 'laser',   name: 'Laser Focus',   emoji: '🎯', desc: '10 sessions without breaking' },
  { id: 'detox',   name: 'Digital Detox', emoji: '📵', desc: 'Full day under 1h screen time' },
  { id: 'night',   name: 'Night Owl',     emoji: '🌙', desc: '30-day streak' },
  { id: 'master',  name: 'Focus Master',  emoji: '👑', desc: 'Reach Level 10' },
  { id: 'early',   name: 'Early Bird',    emoji: '🌅', desc: '7 sessions before 9 AM' },
  { id: 'streak',  name: 'Unstoppable',   emoji: '🔥', desc: '60-day streak' },
];

export const CHALLENGES = [
  { id: 'weekly', label: 'Weekly challenge', desc: 'Meet daily goal for 7 days', total: 7, reward: 200 },
  { id: 'focus',  label: 'Focus marathon',   desc: '5 focus sessions today',     total: 5, reward: 100 },
  { id: 'detox',  label: 'Screen detox',     desc: 'Stay under 2h for 3 days',   total: 3, reward: 150 },
];

export const QUESTS = [
  { id: 'q1', type: 'daily', label: 'Daily: 2 Focus Sessions', target: 2, reward: 20 },
  { id: 'q2', type: 'daily', label: 'Daily: Stay under limit', target: 1, reward: 50 },
  { id: 'q3', type: 'weekly', label: 'Weekly: 10 Focus Sessions', target: 10, reward: 150 },
];

export const DAILY_GOAL_HOURS = 3;
export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
