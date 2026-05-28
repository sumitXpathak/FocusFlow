export const DEFAULT_APPS = [
  { id: '1', name: 'Facebook',   icon: '📘', color: '#E8F0FE', limit: 45,  used: 48, blocked: false },
  { id: '2', name: 'Instagram',  icon: '📸', color: '#FDE8F0', limit: 60,  used: 32, blocked: true  },
  { id: '3', name: 'YouTube',    icon: '▶️', color: '#FFE8E8', limit: 45,  used: 41, blocked: false },
  { id: '4', name: 'Twitter/X',  icon: '🐦', color: '#E8F8FF', limit: 30,  used: 13, blocked: true  },
  { id: '5', name: 'TikTok',     icon: '🎵', color: '#F0E8FF', limit: 30,  used: 8,  blocked: true  },
  { id: '6', name: 'Reddit',     icon: '🤖', color: '#FFE8E0', limit: 20,  used: 5,  blocked: false },
];

export const SESSION_TYPES = [
  { id: 'deep',   label: 'Deep Work',   emoji: '🎯', duration: 25, points: 15 },
  { id: 'light',  label: 'Light Focus', emoji: '💡', duration: 15, points: 8  },
  { id: 'flow',   label: 'Flow State',  emoji: '🌊', duration: 50, points: 25 },
  { id: 'custom', label: 'Custom',      emoji: '⚙️', duration: 25, points: 10 },
];

export const BADGES = [
  { id: 'laser',   name: 'Laser Focus',   emoji: '🎯', desc: '10 sessions without breaking', unlocked: true  },
  { id: 'detox',   name: 'Digital Detox', emoji: '📵', desc: 'Full day under 1h screen time', unlocked: true  },
  { id: 'night',   name: 'Night Owl',     emoji: '🌙', desc: '30-day streak',                 unlocked: false },
  { id: 'master',  name: 'Focus Master',  emoji: '👑', desc: 'Reach Level 10',                unlocked: false },
  { id: 'early',   name: 'Early Bird',    emoji: '🌅', desc: '7 sessions before 9 AM',        unlocked: false },
  { id: 'streak',  name: 'Unstoppable',   emoji: '🔥', desc: '60-day streak',                 unlocked: false },
];

export const CHALLENGES = [
  { id: 'weekly', label: 'Weekly challenge', desc: 'Meet daily goal for 7 days',   progress: 5, total: 7,  reward: 200 },
  { id: 'focus',  label: 'Focus marathon',   desc: '5 focus sessions today',       progress: 2, total: 5,  reward: 100 },
  { id: 'detox',  label: 'Screen detox',     desc: 'Stay under 2h for 3 days',     progress: 1, total: 3,  reward: 150 },
];

export const DAILY_GOAL_HOURS = 3;
export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
