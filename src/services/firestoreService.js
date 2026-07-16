// src/services/firestoreService.js
// Centralised Firestore CRUD — every function scoped to users/{uid}

import {
  doc, setDoc, getDoc, updateDoc, addDoc,
  collection, query, where, orderBy, getDocs, limit,
  deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Helpers ──────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// ─── User Profile ─────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  // Validate data before writing
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }
  await setDoc(doc(db, 'users', uid), sanitized, { merge: true });
}

// ─── Focus Sessions ───────────────────────────
export async function saveFocusSession(uid, session) {
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  await addDoc(sessionsRef, {
    ...session,
    completedAt: new Date().toISOString(),
    date: todayStr(),
  });

  // Update cumulative stats on user profile
  const profile = await getUserProfile(uid);
  if (profile) {
    await updateUserProfile(uid, {
      totalFocusSessions: (profile.totalFocusSessions || 0) + 1,
      totalFocusMinutes: (profile.totalFocusMinutes || 0) + (session.duration || 0),
    });
  }
}

export async function getTodaysSessions(uid) {
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  const q = query(sessionsRef, where('date', '==', todayStr()));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getWeekSessions(uid) {
  const days = last7Days();
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  const q = query(sessionsRef, where('date', 'in', days));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Daily Stats ──────────────────────────────
export async function updateDailyStats(uid, stats) {
  const date = todayStr();
  const ref = doc(db, 'users', uid, 'dailyStats', date);
  await setDoc(ref, { ...stats, date }, { merge: true });
}

export async function getDailyStats(uid, date) {
  const ref = doc(db, 'users', uid, 'dailyStats', date || todayStr());
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function getWeeklyStats(uid) {
  const days = last7Days();
  const results = [];
  for (const day of days) {
    const ref = doc(db, 'users', uid, 'dailyStats', day);
    const snap = await getDoc(ref);
    results.push(snap.exists() ? snap.data() : { date: day, screenTimeMinutes: 0, focusSessions: 0, pointsEarned: 0, goalMet: false });
  }
  return results;
}

export async function getMonthlyStats(uid) {
  const days = last30Days();
  const results = [];
  // Batch fetch in groups of 10 (Firestore 'in' query limit)
  for (let i = 0; i < days.length; i += 10) {
    const batch = days.slice(i, i + 10);
    for (const day of batch) {
      const ref = doc(db, 'users', uid, 'dailyStats', day);
      const snap = await getDoc(ref);
      results.push(snap.exists() ? snap.data() : {
        date: day,
        screenTimeMinutes: 0,
        focusSessions: 0,
        pointsEarned: 0,
        goalMet: false,
        categoryBreakdown: { Social: 0, Entertainment: 0, Productivity: 0, Other: 0 },
      });
    }
  }
  return results;
}

// ─── App Limits & Usage ───────────────────────
export async function saveAppLimits(uid, apps) {
  const ref = doc(db, 'users', uid, 'settings', 'appLimits');
  await setDoc(ref, { apps, updatedAt: new Date().toISOString() });
}

export async function getAppLimits(uid) {
  const ref = doc(db, 'users', uid, 'settings', 'appLimits');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().apps : null;
}

// ─── Blocking Schedules ──────────────────────
export async function saveBlockingSchedules(uid, schedules) {
  const ref = doc(db, 'users', uid, 'settings', 'schedules');
  await setDoc(ref, { schedules, updatedAt: new Date().toISOString() });
}

export async function getBlockingSchedules(uid) {
  const ref = doc(db, 'users', uid, 'settings', 'schedules');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().schedules : null;
}

// ─── Notification Preferences ─────────────────
export async function saveNotificationPrefs(uid, prefs) {
  const ref = doc(db, 'users', uid, 'settings', 'notifications');
  await setDoc(ref, { ...prefs, updatedAt: new Date().toISOString() });
}

export async function getNotificationPrefs(uid) {
  const ref = doc(db, 'users', uid, 'settings', 'notifications');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ─── App Settings (theme, bedtime, strict blocking, etc.) ──
export async function saveAppSettings(uid, settings) {
  const ref = doc(db, 'users', uid, 'settings', 'appSettings');
  await setDoc(ref, { ...settings, updatedAt: new Date().toISOString() });
}

export async function getAppSettings(uid) {
  const ref = doc(db, 'users', uid, 'settings', 'appSettings');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ─── Streak Management ───────────────────────
export async function checkAndUpdateStreak(uid) {
  const profile = await getUserProfile(uid);
  if (!profile) return 0;

  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastActive = profile.lastActiveDate || '';

  let newStreak = profile.streak || 0;

  if (lastActive === today) {
    // Already updated today
    return newStreak;
  } else if (lastActive === yesterdayStr) {
    // Consecutive day — increment streak
    newStreak += 1;
  } else if (lastActive !== '') {
    // Streak broken
    newStreak = 1;
  } else {
    // First time
    newStreak = 1;
  }

  await updateUserProfile(uid, {
    streak: newStreak,
    lastActiveDate: today,
  });

  return newStreak;
}

// ─── Badge Management ─────────────────────────
export async function updateBadgeStatus(uid, badges) {
  await updateUserProfile(uid, { unlockedBadges: badges });
}

export async function getBadgeStatus(uid) {
  const profile = await getUserProfile(uid);
  return profile?.unlockedBadges || [];
}

// ─── Leaderboard ──────────────────────────────
export async function getLeaderboard(maxResults = 50) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('points', 'desc'), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map((d, index) => ({
    uid: d.id,
    rank: index + 1,
    ...d.data(),
  }));
}

export async function getUserRank(uid) {
  // Get all users ordered by points to find rank
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('points', 'desc'));
  const snap = await getDocs(q);
  const index = snap.docs.findIndex(d => d.id === uid);
  return {
    rank: index >= 0 ? index + 1 : null,
    total: snap.docs.length,
    percentile: index >= 0 ? Math.round(((snap.docs.length - index) / snap.docs.length) * 100) : 0,
  };
}

// ─── Data Export ──────────────────────────────
export async function exportUserData(uid) {
  const profile = await getUserProfile(uid);
  const sessions = [];
  const dailyStats = [];

  // Get all sessions
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  const sessionsSnap = await getDocs(sessionsRef);
  sessionsSnap.docs.forEach(d => sessions.push({ id: d.id, ...d.data() }));

  // Get all daily stats
  const statsRef = collection(db, 'users', uid, 'dailyStats');
  const statsSnap = await getDocs(statsRef);
  statsSnap.docs.forEach(d => dailyStats.push({ id: d.id, ...d.data() }));

  // Get settings
  const appLimits = await getAppLimits(uid);
  const schedules = await getBlockingSchedules(uid);
  const notifPrefs = await getNotificationPrefs(uid);
  const appSettings = await getAppSettings(uid);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    sessions,
    dailyStats,
    settings: {
      appLimits,
      schedules,
      notifPrefs,
      appSettings,
    },
  };
}

// ─── Backup & Restore ─────────────────────────
export async function backupUserData(uid) {
  const data = await exportUserData(uid);
  const backupsRef = collection(db, 'users', uid, 'backups');
  const backupDoc = await addDoc(backupsRef, {
    ...data,
    backupDate: new Date().toISOString(),
  });
  return backupDoc.id;
}

export async function getBackupsList(uid) {
  const backupsRef = collection(db, 'users', uid, 'backups');
  const q = query(backupsRef, orderBy('backupDate', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    backupDate: d.data().backupDate,
  }));
}

export async function restoreUserData(uid, backupId) {
  const ref = doc(db, 'users', uid, 'backups', backupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Backup not found');

  const backup = snap.data();

  // Restore profile
  if (backup.profile) {
    const { createdAt, email, ...restoreProfile } = backup.profile;
    await updateUserProfile(uid, restoreProfile);
  }

  // Restore settings
  if (backup.settings) {
    if (backup.settings.appLimits) {
      await saveAppLimits(uid, backup.settings.appLimits);
    }
    if (backup.settings.schedules) {
      await saveBlockingSchedules(uid, backup.settings.schedules);
    }
    if (backup.settings.notifPrefs) {
      await saveNotificationPrefs(uid, backup.settings.notifPrefs);
    }
    if (backup.settings.appSettings) {
      await saveAppSettings(uid, backup.settings.appSettings);
    }
  }

  return true;
}

// ─── Generate Weekly Report ───────────────────
export async function generateWeeklyReport(uid) {
  const weekStats = await getWeeklyStats(uid);
  const weekSessions = await getWeekSessions(uid);
  const profile = await getUserProfile(uid);

  const totalScreenTime = weekStats.reduce((a, s) => a + (s.screenTimeMinutes || 0), 0);
  const avgScreenTime = Math.round(totalScreenTime / 7);
  const goalsMet = weekStats.filter(s => s.goalMet).length;
  const totalSessions = weekSessions.length;
  const totalFocusMinutes = weekSessions.reduce((a, s) => a + (s.duration || 0), 0);
  const totalPoints = weekStats.reduce((a, s) => a + (s.pointsEarned || 0), 0);

  // Category breakdown
  const categoryTotals = { Social: 0, Entertainment: 0, Productivity: 0, Other: 0 };
  weekStats.forEach(s => {
    const cat = s.categoryBreakdown || {};
    Object.keys(cat).forEach(k => {
      categoryTotals[k] = (categoryTotals[k] || 0) + (cat[k] || 0);
    });
  });

  const bestDay = weekStats.reduce((best, s) =>
    (s.screenTimeMinutes || Infinity) < (best.screenTimeMinutes || Infinity) ? s : best,
    weekStats[0] || {}
  );

  const report = {
    generatedAt: new Date().toISOString(),
    weekOf: last7Days()[0],
    summary: {
      totalScreenTime,
      avgScreenTime,
      goalsMet,
      goalsTotal: 7,
      totalSessions,
      totalFocusMinutes,
      totalPoints,
      streak: profile?.streak || 0,
      level: profile?.level || 1,
    },
    categoryBreakdown: categoryTotals,
    bestDay: bestDay?.date || null,
    dailyBreakdown: weekStats,
  };

  // Save report to Firestore
  const reportsRef = collection(db, 'users', uid, 'weeklyReports');
  await addDoc(reportsRef, report);

  return report;
}

// ─── Reset All User Data ─────────────────────
export async function resetAllUserData(uid) {
  // Reset profile to defaults
  await updateUserProfile(uid, {
    points: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
    streak: 0,
    lastActiveDate: '',
    totalFocusSessions: 0,
    totalFocusMinutes: 0,
    unlockedBadges: [],
  });

  // Delete sessions sub-collection (batch)
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  const sessionsSnap = await getDocs(sessionsRef);
  const batch = writeBatch(db);
  sessionsSnap.docs.forEach(d => batch.delete(d.ref));

  // Delete daily stats sub-collection
  const statsRef = collection(db, 'users', uid, 'dailyStats');
  const statsSnap = await getDocs(statsRef);
  statsSnap.docs.forEach(d => batch.delete(d.ref));

  await batch.commit();
}
