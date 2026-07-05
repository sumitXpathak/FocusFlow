import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_APPS, BADGES, CHALLENGES, DAILY_GOAL_HOURS } from '../constants/data';
import { useAuth } from './AuthContext';
import {
  updateUserProfile,
  updateDailyStats,
  getDailyStats,
  getWeeklyStats,
  getAppLimits,
  saveAppLimits as firestoreSaveAppLimits,
  checkAndUpdateStreak,
} from '../services/firestoreService';

const AppContext = createContext();

const initialState = {
  apps: DEFAULT_APPS,
  points: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  streak: 0,
  streakDays: [],
  completedToday: [],
  badges: BADGES,
  challenges: CHALLENGES,
  dailyGoalHours: DAILY_GOAL_HOURS,
  screenTimeToday: 0,
  focusSessionsToday: 0,
  pointsToday: 0,
  blockingEnabled: true,
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
  categoryData: { Social: 0, Entertainment: 0, Productivity: 0, Other: 0 },
  profileLoaded: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_PROFILE':
      return {
        ...state,
        ...action.payload,
        profileLoaded: true,
      };
    case 'LOAD_DAILY_STATS':
      return {
        ...state,
        screenTimeToday: action.payload.screenTimeMinutes || 0,
        focusSessionsToday: action.payload.focusSessions || 0,
        pointsToday: action.payload.pointsEarned || 0,
        categoryData: action.payload.categoryBreakdown || state.categoryData,
      };
    case 'LOAD_WEEKLY_DATA':
      return {
        ...state,
        weeklyData: action.payload,
      };
    case 'LOAD_APP_LIMITS':
      return {
        ...state,
        apps: action.payload,
      };
    case 'ADD_POINTS':
      return {
        ...state,
        points: state.points + action.payload,
        pointsToday: state.pointsToday + action.payload,
        xp: state.xp + action.payload,
      };
    case 'COMPLETE_SESSION':
      return {
        ...state,
        focusSessionsToday: state.focusSessionsToday + 1,
        points: state.points + action.payload,
        pointsToday: state.pointsToday + action.payload,
        xp: state.xp + action.payload,
      };
    case 'TOGGLE_BLOCKING':
      return { ...state, blockingEnabled: !state.blockingEnabled };
    case 'TOGGLE_APP_BLOCK':
      return {
        ...state,
        apps: state.apps.map(app =>
          app.id === action.payload ? { ...app, blocked: !app.blocked } : app
        ),
      };
    case 'SET_APP_LIMIT':
      return {
        ...state,
        apps: state.apps.map(app =>
          app.id === action.payload.id ? { ...app, limit: action.payload.limit } : app
        ),
      };
    case 'UPDATE_STREAK':
      return { ...state, streak: action.payload };
    case 'SET_DAILY_GOAL':
      return { ...state, dailyGoalHours: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'RESET':
      return { ...initialState, profileLoaded: true };
    default:
      return state;
  }
}

// ── Level calculation helper ────────────────
function calculateLevel(xp) {
  // Each level needs progressively more XP
  const thresholds = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1] + 1000;
  return { level, xpToNext: nextThreshold, xpProgress: xp - currentThreshold };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user, userProfile, isAuthenticated } = useAuth();
  const syncTimeoutRef = useRef(null);

  // ── Load data from Firestore when user logs in ──
  useEffect(() => {
    if (isAuthenticated && user && userProfile) {
      loadFromFirestore();
    } else if (!isAuthenticated) {
      // Not logged in — try loading from AsyncStorage (offline/guest mode)
      loadFromAsyncStorage();
    }
  }, [isAuthenticated, user?.uid, userProfile]);

  async function loadFromFirestore() {
    try {
      // 1. Load profile into state
      const { level, xpToNext } = calculateLevel(userProfile.xp || 0);
      dispatch({
        type: 'LOAD_PROFILE',
        payload: {
          points: userProfile.points || 0,
          level,
          xp: userProfile.xp || 0,
          xpToNext,
          streak: userProfile.streak || 0,
          dailyGoalHours: userProfile.dailyGoalHours || DAILY_GOAL_HOURS,
        },
      });

      // 2. Check and update streak
      const newStreak = await checkAndUpdateStreak(user.uid);
      dispatch({ type: 'UPDATE_STREAK', payload: newStreak });

      // 3. Load today's daily stats
      const todayStats = await getDailyStats(user.uid);
      if (todayStats) {
        dispatch({ type: 'LOAD_DAILY_STATS', payload: todayStats });
      }

      // 4. Load weekly stats for insights
      const weeklyStats = await getWeeklyStats(user.uid);
      const weeklyData = weeklyStats.map(s => s.screenTimeMinutes || 0);
      dispatch({ type: 'LOAD_WEEKLY_DATA', payload: weeklyData });

      // 5. Load app limits
      const savedApps = await getAppLimits(user.uid);
      if (savedApps && savedApps.length > 0) {
        dispatch({ type: 'LOAD_APP_LIMITS', payload: savedApps });
      }
    } catch (e) {
      console.log('Error loading Firestore data:', e.message);
      // Fallback to AsyncStorage
      loadFromAsyncStorage();
    }
  }

  async function loadFromAsyncStorage() {
    try {
      const saved = await AsyncStorage.getItem('focusflow_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: { ...parsed, profileLoaded: true } });
        return;
      }
    } catch (e) {
      console.log('No saved state found');
    }
    // Mark as loaded even when there was nothing to load, otherwise the
    // persistence effect below early-returns forever and guest/offline
    // state is never written to disk.
    dispatch({ type: 'LOAD_STATE', payload: { profileLoaded: true } });
  }

  // ── Persist to AsyncStorage (always, as offline cache) ──
  useEffect(() => {
    if (!state.profileLoaded) return;
    AsyncStorage.setItem('focusflow_state', JSON.stringify({
      points: state.points,
      level: state.level,
      xp: state.xp,
      xpToNext: state.xpToNext,
      streak: state.streak,
      apps: state.apps,
      blockingEnabled: state.blockingEnabled,
      dailyGoalHours: state.dailyGoalHours,
      screenTimeToday: state.screenTimeToday,
      focusSessionsToday: state.focusSessionsToday,
      pointsToday: state.pointsToday,
    }));
  }, [state.profileLoaded, state.points, state.streak, state.apps, state.blockingEnabled, state.focusSessionsToday]);

  // ── Debounced sync to Firestore ──────────────
  const syncToFirestore = useCallback(() => {
    if (!isAuthenticated || !user) return;

    // Debounce: wait 2s after last change before writing
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const { level, xpToNext } = calculateLevel(state.xp);

        // Update user profile
        await updateUserProfile(user.uid, {
          points: state.points,
          level,
          xp: state.xp,
          xpToNext,
          streak: state.streak,
          dailyGoalHours: state.dailyGoalHours,
        });

        // Update today's daily stats
        await updateDailyStats(user.uid, {
          screenTimeMinutes: state.screenTimeToday,
          focusSessions: state.focusSessionsToday,
          pointsEarned: state.pointsToday,
          goalMet: state.screenTimeToday <= state.dailyGoalHours * 60,
          categoryBreakdown: state.categoryData,
        });
      } catch (e) {
        console.log('Firestore sync error:', e.message);
      }
    }, 2000);
  }, [isAuthenticated, user, state.points, state.xp, state.streak,
      state.screenTimeToday, state.focusSessionsToday, state.pointsToday]);

  // Trigger sync when relevant state changes
  useEffect(() => {
    if (state.profileLoaded) syncToFirestore();
  }, [state.points, state.focusSessionsToday, state.streak, syncToFirestore]);

  // ── Computed values ─────────────────────────
  const screenTimePercent = Math.min(
    (state.screenTimeToday / (state.dailyGoalHours * 60)) * 100,
    100
  );

  const remainingMinutes = Math.max(
    state.dailyGoalHours * 60 - state.screenTimeToday,
    0
  );

  return (
    <AppContext.Provider value={{
      ...state,
      dispatch,
      screenTimePercent,
      remainingMinutes,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
