// src/context/AuthContext.js
// Global auth state — listens to Firebase, loads Firestore profile

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/firestoreService';
import {
  loginUser,
  registerUser as authRegister,
  logoutUser,
  resetPassword as authResetPassword,
  sendVerificationEmail as authSendVerification,
  updateUserDisplayName as authUpdateName,
  deleteUserAccount as authDeleteAccount,
  reloadUser as authReloadUser,
  changeUserPassword as authChangePassword,
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
  sendVerificationEmail: async () => {},
  updateDisplayName: async () => {},
  deleteAccount: async () => {},
  resetPassword: async () => {},
  changePassword: async () => {},
  reloadUser: async () => {},
  updateDailyGoal: async () => {},
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
  const login = useCallback(async (email, password) => {
    const firebaseUser = await loginUser(email, password);
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    return firebaseUser;
  }, []);

  const register = useCallback(async (email, password, displayName, dailyGoalHours = 3) => {
    const firebaseUser = await authRegister(email, password, displayName, dailyGoalHours);
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    return firebaseUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  }, [user]);

  const markOnboardingComplete = useCallback(() => {
    AsyncStorage.setItem('focusflow_onboarded', 'true');
    setHasOnboarded(true);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    await authSendVerification();
  }, []);

  const updateDisplayName = useCallback(async (newName) => {
    await authUpdateName(newName);
    // Refresh profile to reflect changes
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  }, [user]);

  const deleteAccount = useCallback(async (password) => {
    await authDeleteAccount(password);
    setUser(null);
    setUserProfile(null);
    await AsyncStorage.removeItem('focusflow_onboarded');
    await AsyncStorage.removeItem('focusflow_state');
    await AsyncStorage.removeItem('focusflow_app_prefs');
    await AsyncStorage.removeItem('focusflow_installed_apps');
    await AsyncStorage.removeItem('focusflow_timer_state');
  }, []);

  const resetPassword = useCallback(async (email) => {
    await authResetPassword(email);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await authChangePassword(currentPassword, newPassword);
  }, []);

  const reloadUser = useCallback(async () => {
    const refreshedUser = await authReloadUser();
    if (refreshedUser) {
      setUser(refreshedUser);
    }
  }, []);

  const updateDailyGoal = useCallback(async (hours) => {
    if (user) {
      const { updateUserProfile } = require('../services/firestoreService');
      await updateUserProfile(user.uid, { dailyGoalHours: hours });
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  }, [user]);

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
      sendVerificationEmail,
      updateDisplayName,
      deleteAccount,
      resetPassword,
      changePassword,
      reloadUser,
      updateDailyGoal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) || DEFAULT_AUTH;
