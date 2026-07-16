// src/services/authService.js
// Wraps Firebase Auth calls — swap this file to change auth provider

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
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

  // Send email verification
  try {
    await sendEmailVerification(cred.user);
  } catch (e) {
    console.log('Email verification send failed:', e.message);
  }

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
    emailVerified:  false,
    badges:         [],
    totalFocusSessions: 0,
    totalFocusMinutes:  0,
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

// ── Send email verification ───────────────────
export async function sendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  await sendEmailVerification(user);
}

// ── Check if email is verified ────────────────
export function isEmailVerified() {
  const user = auth.currentUser;
  return user?.emailVerified ?? false;
}

// ── Reload user (refresh email verified status) ──
export async function reloadUser() {
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  return auth.currentUser;
}

// ── Update display name ───────────────────────
export async function updateUserDisplayName(newDisplayName) {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  await updateProfile(user, { displayName: newDisplayName });
  // Also update Firestore profile
  await setDoc(doc(db, 'users', user.uid), { displayName: newDisplayName }, { merge: true });
}

// ── Change password ───────────────────────────
export async function changeUserPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No user signed in');
  // Re-authenticate first
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

// ── Re-authenticate user ──────────────────────
export async function reauthenticateUser(password) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No user signed in');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

// ── Delete account ────────────────────────────
// Requires recent authentication. Caller should reauthenticate first.
export async function deleteUserAccount(password) {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');

  // Re-authenticate before destructive operation
  if (user.email && password) {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  }

  const uid = user.uid;

  // Delete Firestore user data (subcollections + main doc)
  try {
    const batch = writeBatch(db);

    // Delete sessions subcollection
    const sessionsRef = collection(db, 'users', uid, 'sessions');
    const sessionsSnap = await getDocs(sessionsRef);
    sessionsSnap.docs.forEach(d => batch.delete(d.ref));

    // Delete dailyStats subcollection
    const statsRef = collection(db, 'users', uid, 'dailyStats');
    const statsSnap = await getDocs(statsRef);
    statsSnap.docs.forEach(d => batch.delete(d.ref));

    // Delete settings subcollection
    const settingsRef = collection(db, 'users', uid, 'settings');
    const settingsSnap = await getDocs(settingsRef);
    settingsSnap.docs.forEach(d => batch.delete(d.ref));

    // Delete backups subcollection
    const backupsRef = collection(db, 'users', uid, 'backups');
    const backupsSnap = await getDocs(backupsRef);
    backupsSnap.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();

    // Delete main user document
    await deleteDoc(doc(db, 'users', uid));
  } catch (e) {
    console.log('Error deleting Firestore data:', e.message);
  }

  // Delete Firebase Auth account
  await deleteUser(user);
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
