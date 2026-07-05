// src/context/AuthContext.js
// Global auth state — listens to Firebase, loads Firestore profile

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/firestoreService';
import {
  loginUser,
  registerUser as authRegister,
  logoutUser,
} from '../services/authService';

// Safe defaults so consumers rendered outside <AuthProvider> (e.g. in isolated
// tests, or by accident) degrade gracefully instead of crashing on destructure.
const DEFAULT_AUTH = {
  user: null,
  userProfile: null,
  loading: false,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  markOnboardingComplete: () => {},
};

const AuthContext = createContext(DEFAULT_AUTH);

export function AuthProvider({ children }) {
  const [user, setUser]                           = useState(null);
  const [userProfile, setUserProfile]             = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [hasCompletedOnboarding, setHasOnboarded] = useState(false);

  // ── Listen to Firebase auth state ───────────
  useEffect(() => {
    let timeoutId;
    let unsubscribe;

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(timeoutId);
        setUser(firebaseUser);

        if (firebaseUser) {
          try {
            const profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (e) {
            console.log('Failed to load profile:', e.message);
          }
          // Mark onboarding as completed if user logged in
          await AsyncStorage.setItem('focusflow_onboarded', 'true');
          setHasOnboarded(true);
        } else {
          setUserProfile(null);
        }

        setLoading(false);
      });
    } catch (e) {
      console.log('Firebase auth listener failed:', e.message);
      setLoading(false);
    }

    // Safety timeout — if Firebase never responds, proceed anyway
    timeoutId = setTimeout(() => {
      console.log('Firebase auth timeout — proceeding without auth');
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ── Check onboarding flag on mount ──────────
  useEffect(() => {
    (async () => {
      const flag = await AsyncStorage.getItem('focusflow_onboarded');
      if (flag === 'true') setHasOnboarded(true);
    })();
  }, []);

  // ── Actions ─────────────────────────────────
  async function login(email, password) {
    const firebaseUser = await loginUser(email, password);
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    return firebaseUser;
  }

  async function register(email, password, displayName, dailyGoalHours = 3) {
    const firebaseUser = await authRegister(email, password, displayName, dailyGoalHours);
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    return firebaseUser;
  }

  async function logout() {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
  }

  async function refreshProfile() {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  }

  function markOnboardingComplete() {
    AsyncStorage.setItem('focusflow_onboarded', 'true');
    setHasOnboarded(true);
  }

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isAuthenticated,
      hasCompletedOnboarding,
      login,
      register,
      logout,
      refreshProfile,
      markOnboardingComplete,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) || DEFAULT_AUTH;
