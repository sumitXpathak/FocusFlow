// src/services/firebase.js
// ─────────────────────────────────────────────
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project called "FocusFlow"
// 3. Add an Android/iOS app
// 4. Copy your config object below
// 5. Run: npm install firebase
// ─────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "focusflow-de6ee.firebaseapp.com",
  projectId: "focusflow-de6ee",
  storageBucket: "focusflow-de6ee.firebasestorage.app",
  messagingSenderId: "YOUR_PROJECT_NUMBER",
  appId: "1:YOUR_PROJECT_NUMBER:web:f1fd7e7f43345b8d3549f9",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export default app;
