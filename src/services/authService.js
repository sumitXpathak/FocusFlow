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

// ── Register ──────────────────────────────────
export async function registerUser(email, password, displayName, dailyGoalHours = 3) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  // Create user document in Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    displayName,
    email,
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
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Logout ────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ── Reset password ────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
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
