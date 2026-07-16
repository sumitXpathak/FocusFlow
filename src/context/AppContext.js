import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGES, CHALLENGES, QUESTS, DAILY_GOAL_HOURS, startOfTodayMs } from '../constants/data';
import { useAuth } from './AuthContext';
import ExpoAppBlockerModule from '../../modules/expo-app-blocker/src/ExpoAppBlockerModule';
import {
  updateUserProfile,
  updateDailyStats,
  getDailyStats,
  getWeeklyStats,
  getAppLimits,
  checkAndUpdateStreak,
  getBlockingSchedules,
  updateBadgeStatus,
} from '../services/firestoreService';
import { sendLevelUpNotification, sendBadgeUnlockNotification } from '../services/notificationService';

const AppContext = createContext();

const CACHE_INSTALLED   = 'focusflow_installed_apps';
const CACHE_APP_PREFS   = 'focusflow_app_prefs';
const CACHE_STATE       = 'focusflow_state';
const USAGE_POLL_MS = 30_000;

const initialState = {
  installedApps: [],
  apps: [],
  schedules: [],
  focusActive: false,
  points: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  streak: 0,
  unlockedBadges: [],
  challengeProgress: {}, // { challengeId: progress }
  quests: [], // dynamic quests progress
  dailyGoalHours: DAILY_GOAL_HOURS,
  screenTimeToday: 0,
  focusSessionsToday: 0,
  pointsToday: 0,
  blockingEnabled: true,
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
  categoryData: { Social: 0, Entertainment: 0, Productivity: 0, Other: 0 },
  profileLoaded: false,
  productivityScore: 0,
  consecutiveFocusSessions: 0, // For "Laser Focus" badge
};

function mergeAppsWithPrefs(installedApps, prefs) {
  return installedApps.map(app => {
    const pref = prefs[app.packageName] || {};
    return {
      id: app.packageName,
      packageName: app.packageName,
      name: app.name,
      icon: '',
      color: '#E8F0FE',
      limit: pref.limit ?? 60,
      used: pref.used ?? 0,
      blocked: pref.blocked ?? false,
    };
  });
}

function extractPrefs(apps) {
  const prefs = {};
  for (const app of apps) {
    prefs[app.packageName] = { limit: app.limit, blocked: app.blocked };
  }
  return prefs;
}

function calculateLevel(xp) {
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

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INSTALLED_APPS': {
      const prefs = action.prefs || extractPrefs(state.apps);
      const merged = mergeAppsWithPrefs(action.payload, prefs);
      return { ...state, installedApps: action.payload, apps: merged };
    }
    case 'LOAD_PROFILE':
      return { ...state, ...action.payload, profileLoaded: true };
    case 'LOAD_DAILY_STATS':
      return {
        ...state,
        screenTimeToday: action.payload.screenTimeMinutes || 0,
        focusSessionsToday: action.payload.focusSessions || 0,
        pointsToday: action.payload.pointsEarned || 0,
        categoryData: action.payload.categoryBreakdown || state.categoryData,
        consecutiveFocusSessions: action.payload.consecutiveFocusSessions || 0,
      };
    case 'LOAD_WEEKLY_DATA':
      return { ...state, weeklyData: action.payload };
    case 'LOAD_APP_LIMITS': {
      const prefMap = {};
      for (const a of action.payload) {
        prefMap[a.packageName || a.id] = { limit: a.limit, blocked: a.blocked };
      }
      return { ...state, apps: mergeAppsWithPrefs(state.installedApps, prefMap) };
    }
    case 'UPDATE_USAGE': {
      const usage = action.payload;
      const totalUsed = Object.values(usage).reduce((a, b) => a + b, 0);
      return {
        ...state,
        apps: state.apps.map(app => ({
          ...app,
          used: Math.round(usage[app.packageName] || 0),
        })),
        screenTimeToday: Math.round(totalUsed),
      };
    }
    case 'ADD_POINTS': {
      const newXp = state.xp + action.payload;
      const { level, xpToNext } = calculateLevel(newXp);
      if (level > state.level) {
        sendLevelUpNotification(level).catch(() => {});
      }
      return {
        ...state,
        points: state.points + action.payload,
        pointsToday: state.pointsToday + action.payload,
        xp: newXp,
        level,
        xpToNext,
      };
    }
    case 'COMPLETE_SESSION': {
      const newXp = state.xp + action.payload;
      const { level, xpToNext } = calculateLevel(newXp);
      const newFocusSessionsToday = state.focusSessionsToday + 1;
      const newConsecutive = state.consecutiveFocusSessions + 1;
      const newChallengeProgress = { ...state.challengeProgress };
      newChallengeProgress['focus'] = (newChallengeProgress['focus'] || 0) + 1;

      if (level > state.level) {
        sendLevelUpNotification(level).catch(() => {});
      }

      return {
        ...state,
        focusSessionsToday: newFocusSessionsToday,
        consecutiveFocusSessions: newConsecutive,
        points: state.points + action.payload,
        pointsToday: state.pointsToday + action.payload,
        xp: newXp,
        level,
        xpToNext,
        challengeProgress: newChallengeProgress,
      };
    }
    case 'BREAK_CONSECUTIVE':
      return { ...state, consecutiveFocusSessions: 0 };
    case 'EVALUATE_BADGES': {
      const newBadges = [...state.unlockedBadges];
      let unlockedAny = false;
      BADGES.forEach(badge => {
        if (!newBadges.includes(badge.id)) {
          let unlock = false;
          if (badge.id === 'laser' && state.consecutiveFocusSessions >= 10) unlock = true;
          if (badge.id === 'master' && state.level >= 10) unlock = true;
          if (badge.id === 'night' && state.streak >= 30) unlock = true;
          if (badge.id === 'streak' && state.streak >= 60) unlock = true;
          
          if (unlock) {
            newBadges.push(badge.id);
            unlockedAny = true;
            sendBadgeUnlockNotification(badge.name, badge.emoji).catch(() => {});
          }
        }
      });
      return unlockedAny ? { ...state, unlockedBadges: newBadges } : state;
    }
    case 'EVALUATE_QUESTS': {
      // Dynamic quest evaluation logic
      const newQuests = [...state.quests];
      if (newQuests.length === 0) {
        // Init quests
        QUESTS.forEach(q => newQuests.push({ ...q, current: 0, completed: false }));
      }
      
      let updated = false;
      newQuests.forEach(q => {
        if (!q.completed) {
          if (q.id === 'q1') {
            q.current = state.focusSessionsToday;
            if (q.current >= q.target) q.completed = true;
            updated = true;
          }
        }
      });
      return updated ? { ...state, quests: newQuests } : state;
    }
    case 'CALC_PRODUCTIVITY': {
      // Calculate a productivity score 0-100
      let score = 50;
      score += (state.focusSessionsToday * 5);
      const limitMins = state.dailyGoalHours * 60;
      if (state.screenTimeToday < limitMins) {
        score += ((limitMins - state.screenTimeToday) / limitMins) * 30;
      } else {
        score -= 20;
      }
      score += Math.min(state.streak * 2, 20);
      score = Math.max(0, Math.min(100, Math.round(score)));
      return { ...state, productivityScore: score };
    }
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
    case 'SET_FOCUS_ACTIVE':
      return { ...state, focusActive: action.payload };
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload };
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

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user, userProfile, isAuthenticated } = useAuth();
  const syncTimeoutRef = useRef(null);
  const usagePollRef = useRef(null);

  useEffect(() => {
    loadInstalledApps();
  }, []);

  async function loadInstalledApps() {
    let apps = [];
    let cachedPrefs = {};

    try {
      const prefsJson = await AsyncStorage.getItem(CACHE_APP_PREFS);
      if (prefsJson) cachedPrefs = JSON.parse(prefsJson);
    } catch (_) {}

    if (Platform.OS === 'android' && ExpoAppBlockerModule?.getInstalledApps) {
      try {
        apps = ExpoAppBlockerModule.getInstalledApps() || [];
      } catch (e) {
        console.log('Native getInstalledApps failed:', e.message);
      }
    }

    if (apps.length === 0) {
      try {
        const cached = await AsyncStorage.getItem(CACHE_INSTALLED);
        if (cached) apps = JSON.parse(cached);
      } catch (_) {}
    }

    if (apps.length > 0) {
      AsyncStorage.setItem(CACHE_INSTALLED, JSON.stringify(apps)).catch(() => {});
      dispatch({ type: 'SET_INSTALLED_APPS', payload: apps, prefs: cachedPrefs });
    }
  }

  useEffect(() => {
    if (isAuthenticated && user && userProfile) {
      loadFromFirestore();
    } else if (!isAuthenticated) {
      loadFromAsyncStorage();
    }
  }, [isAuthenticated, user?.uid, userProfile]);

  async function loadFromFirestore() {
    try {
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
          unlockedBadges: userProfile.unlockedBadges || [],
          challengeProgress: userProfile.challengeProgress || {},
          quests: userProfile.quests || [],
        },
      });

      const newStreak = await checkAndUpdateStreak(user.uid);
      dispatch({ type: 'UPDATE_STREAK', payload: newStreak });

      const todayStats = await getDailyStats(user.uid);
      if (todayStats) {
        dispatch({ type: 'LOAD_DAILY_STATS', payload: todayStats });
      }

      const weeklyStats = await getWeeklyStats(user.uid);
      const weeklyData = weeklyStats.map(s => s.screenTimeMinutes || 0);
      dispatch({ type: 'LOAD_WEEKLY_DATA', payload: weeklyData });

      const savedApps = await getAppLimits(user.uid);
      if (savedApps && savedApps.length > 0) {
        dispatch({ type: 'LOAD_APP_LIMITS', payload: savedApps });
      }

      const savedSchedules = await getBlockingSchedules(user.uid);
      if (savedSchedules && savedSchedules.length > 0) {
        dispatch({ type: 'SET_SCHEDULES', payload: savedSchedules });
      }

      dispatch({ type: 'EVALUATE_BADGES' });
      dispatch({ type: 'EVALUATE_QUESTS' });
      dispatch({ type: 'CALC_PRODUCTIVITY' });
    } catch (e) {
      console.log('Error loading Firestore data:', e.message);
      loadFromAsyncStorage();
    }
  }

  async function loadFromAsyncStorage() {
    try {
      const saved = await AsyncStorage.getItem(CACHE_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        const { installedApps: _ia, apps: _a, ...rest } = parsed;
        dispatch({ type: 'LOAD_STATE', payload: { ...rest, profileLoaded: true } });
        return;
      }
    } catch (e) {
      console.log('No saved state found');
    }
    dispatch({ type: 'LOAD_STATE', payload: { profileLoaded: true } });
  }

  // ── Usage polling ──────────────
  useEffect(() => {
    if (Platform.OS !== 'android' || !ExpoAppBlockerModule?.getUsageStats) return;

    function pollUsage() {
      try {
        const usage = ExpoAppBlockerModule.getUsageStats(startOfTodayMs());
        if (usage && typeof usage === 'object') {
          dispatch({ type: 'UPDATE_USAGE', payload: usage });
          dispatch({ type: 'CALC_PRODUCTIVITY' });
        }
      } catch (e) {
        console.log('Usage poll error:', e.message);
      }
    }

    pollUsage();
    usagePollRef.current = setInterval(pollUsage, USAGE_POLL_MS);

    return () => {
      if (usagePollRef.current) clearInterval(usagePollRef.current);
    };
  }, []);

  // ── Push enforcement config to native ──────
  useEffect(() => {
    if (Platform.OS !== 'android' || !ExpoAppBlockerModule?.updateEnforcementConfig) return;
    if (state.apps.length === 0) return; 

    const config = {
      masterEnabled: state.blockingEnabled,
      focusActive: state.focusActive,
      focusPackages: state.apps.filter(a => a.blocked).map(a => a.packageName),
      limits: state.apps.filter(a => a.limit > 0).map(a => ({
        packageName: a.packageName,
        dailyLimitMinutes: a.limit,
      })),
      schedules: (state.schedules || []).filter(s => s.active),
    };

    try {
      ExpoAppBlockerModule.updateEnforcementConfig(JSON.stringify(config));
    } catch (e) {
      console.log('Enforcement config push error:', e.message);
    }
  }, [state.apps, state.blockingEnabled, state.focusActive, state.schedules]);

  // ── Persist to AsyncStorage ──
  useEffect(() => {
    if (!state.profileLoaded) return;

    AsyncStorage.setItem(CACHE_STATE, JSON.stringify({
      points: state.points,
      level: state.level,
      xp: state.xp,
      xpToNext: state.xpToNext,
      streak: state.streak,
      unlockedBadges: state.unlockedBadges,
      challengeProgress: state.challengeProgress,
      quests: state.quests,
      blockingEnabled: state.blockingEnabled,
      dailyGoalHours: state.dailyGoalHours,
      screenTimeToday: state.screenTimeToday,
      focusSessionsToday: state.focusSessionsToday,
      pointsToday: state.pointsToday,
      schedules: state.schedules,
      consecutiveFocusSessions: state.consecutiveFocusSessions,
    })).catch(() => {});

    if (state.apps.length > 0) {
      AsyncStorage.setItem(CACHE_APP_PREFS, JSON.stringify(extractPrefs(state.apps))).catch(() => {});
    }
  }, [state.profileLoaded, state.points, state.streak, state.apps,
      state.blockingEnabled, state.focusSessionsToday, state.schedules,
      state.unlockedBadges, state.challengeProgress, state.quests]);

  // ── Sync gamification events ──────────────
  useEffect(() => {
    if (state.profileLoaded) {
      dispatch({ type: 'EVALUATE_BADGES' });
      dispatch({ type: 'EVALUATE_QUESTS' });
      dispatch({ type: 'CALC_PRODUCTIVITY' });
    }
  }, [state.focusSessionsToday, state.streak, state.level, state.profileLoaded]);

  // ── Sync to Firestore ──────────────
  const syncToFirestore = useCallback(() => {
    if (!isAuthenticated || !user) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const { level, xpToNext } = calculateLevel(state.xp);

        await updateUserProfile(user.uid, {
          points: state.points,
          level,
          xp: state.xp,
          xpToNext,
          streak: state.streak,
          dailyGoalHours: state.dailyGoalHours,
          unlockedBadges: state.unlockedBadges,
          challengeProgress: state.challengeProgress,
          quests: state.quests,
        });

        await updateDailyStats(user.uid, {
          screenTimeMinutes: state.screenTimeToday,
          focusSessions: state.focusSessionsToday,
          pointsEarned: state.pointsToday,
          goalMet: state.screenTimeToday <= state.dailyGoalHours * 60,
          categoryBreakdown: state.categoryData,
          consecutiveFocusSessions: state.consecutiveFocusSessions,
        });
      } catch (e) {
        console.log('Firestore sync error:', e.message);
      }
    }, 2000);
  }, [isAuthenticated, user, state.points, state.xp, state.streak,
      state.screenTimeToday, state.focusSessionsToday, state.pointsToday,
      state.unlockedBadges, state.challengeProgress, state.quests, state.consecutiveFocusSessions]);

  useEffect(() => {
    if (state.profileLoaded) syncToFirestore();
  }, [state.points, state.focusSessionsToday, state.streak, state.unlockedBadges, syncToFirestore]);

  const screenTimePercent = Math.min((state.screenTimeToday / (state.dailyGoalHours * 60)) * 100, 100);
  const remainingMinutes = Math.max(state.dailyGoalHours * 60 - state.screenTimeToday, 0);

  return (
    <AppContext.Provider value={{ ...state, dispatch, screenTimePercent, remainingMinutes }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
