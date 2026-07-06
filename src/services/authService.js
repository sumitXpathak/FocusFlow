// src/services/authService.js
// Wraps Firebase Auth calls — swap this file to change auth provider

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Normalize email input — mobile keyboards frequently add a trailing space or
// capitalize the first letter, which Firebase rejects as auth/invalid-email or
// treats as a different account. Trim + lowercase before every call.
function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

// ── Register ──────────────────────────────────
export async function registerUser(email, password, displayName, dailyGoalHours = 3) {
  const cleanEmail = normalizeEmail(email);
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  await updateProfile(cred.user, { displayName });
  // Create user document in Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    displayName,
    email: cleanEmail,
    points:         0,
    level:          1,
    xp:             0,
    xpToNext:       100,
    streak:         0,
    dailyGoalHours,
    lastActiveDate: '',
    createdAt:      new Date().toISOString(),
  });
  return cred.user;
}

// ── Login ─────────────────────────────────────
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  return cred.user;
}

// ── Logout ────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ── Reset password ────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, normalizeEmail(email));
}

// ── Get user profile from Firestore ───────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Auth state listener ───────────────────────
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
