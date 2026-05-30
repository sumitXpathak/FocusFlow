// src/services/firestoreService.js
// Centralised Firestore CRUD — every function scoped to users/{uid}

import {
  doc, setDoc, getDoc, updateDoc, addDoc,
  collection, query, where, orderBy, getDocs,
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

// ─── User Profile ─────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ─── Focus Sessions ───────────────────────────
export async function saveFocusSession(uid, session) {
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  await addDoc(sessionsRef, {
    ...session,
    completedAt: new Date().toISOString(),
    date: todayStr(),
  });
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
