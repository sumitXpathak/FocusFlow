// src/services/firebase.js
// ─────────────────────────────────────────────
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project called "FocusFlow"
// 3. Add an Android/iOS app
// 4. Copy your config object below
// 5. Run: npm install firebase
// ─────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDEWdMmOyRL9HxxOlEZCau08dLSoFkYS6s",
  authDomain: "focusflow-de6ee.firebaseapp.com",
  projectId: "focusflow-de6ee",
  storageBucket: "focusflow-de6ee.firebasestorage.app",
  messagingSenderId: "977040244860",
  appId: "1:977040244860:web:f1fd7e7f43345b8d3549f9",
  measurementId: "G-B244WBCJEM"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
