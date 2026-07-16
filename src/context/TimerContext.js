import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_TYPES, DEFAULT_BREAK_MINUTES } from '../constants/data';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import { saveFocusSession, getTodaysSessions } from '../services/firestoreService';
import { sendTimerCompleteNotification } from '../services/notificationService';

const TimerContext = createContext();

const TIMER_CACHE_KEY = 'focusflow_timer_state';

export function TimerProvider({ children }) {
  const { dispatch } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [customDuration, setCustomDuration] = useState(25); // minutes for custom type
  const [secondsLeft, setSecondsLeft] = useState(SESSION_TYPES[0].duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]); // today's completed sessions
  const [startedAt, setStartedAt] = useState(null); // timestamp when timer was started
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const activeDuration = sessionType.id === 'custom' ? customDuration : sessionType.duration;
  const totalSeconds = isBreak ? DEFAULT_BREAK_MINUTES * 60 : activeDuration * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  // ── Load today's session history on mount ──────────
  useEffect(() => {
    if (isAuthenticated && user) {
      getTodaysSessions(user.uid)
        .then(sessions => {
          setSessionHistory(sessions);
          setSessionsCompleted(sessions.length);
        })
        .catch(e => console.log('Load sessions error:', e.message));
    }
  }, [isAuthenticated, user]);

  // ── Restore timer state from AsyncStorage ──────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TIMER_CACHE_KEY);
        if (!saved) return;
        const state = JSON.parse(saved);

        // Find matching session type
        const matchedType = SESSION_TYPES.find(s => s.id === state.sessionTypeId) || SESSION_TYPES[0];
        setSessionType(matchedType);
        setIsBreak(state.isBreak || false);

        if (state.customDuration) {
          setCustomDuration(state.customDuration);
        }

        if (state.isRunning && state.startedAt) {
          // Calculate elapsed time since the timer was running
          const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
          const totalDur = state.isBreak
            ? DEFAULT_BREAK_MINUTES * 60
            : (matchedType.id === 'custom' ? (state.customDuration || 25) : matchedType.duration) * 60;
          const remaining = totalDur - elapsed;

          if (remaining > 0) {
            // Timer still has time left — resume
            setSecondsLeft(remaining);
            setStartedAt(state.startedAt);
            setIsRunning(true);
          } else {
            // Timer would have completed while backgrounded
            handleTimerComplete(matchedType, state.isBreak, state.customDuration || 25);
          }
        } else if (state.secondsLeft > 0) {
          // Timer was paused — restore position
          setSecondsLeft(state.secondsLeft);
        }
      } catch (e) {
        console.log('Timer restore error:', e.message);
      }
    })();
  }, []);

  // ── Handle app state changes (background/foreground) ──
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // App came to foreground — recalculate timer if running
        if (isRunning && startedAt) {
          const elapsed = Math.floor((Date.now() - startedAt) / 1000);
          const remaining = totalSeconds - elapsed;
          if (remaining > 0) {
            setSecondsLeft(remaining);
          } else {
            // Timer completed while in background
            handleTimerComplete(sessionType, isBreak, customDuration);
          }
        }
      }
      appStateRef.current = nextState;
    });

    return () => subscription?.remove();
  }, [isRunning, startedAt, totalSeconds, sessionType, isBreak, customDuration]);

  // ── Persist timer state ────────────────────────────
  useEffect(() => {
    const state = {
      sessionTypeId: sessionType.id,
      secondsLeft,
      isRunning,
      isBreak,
      startedAt,
      customDuration,
    };
    AsyncStorage.setItem(TIMER_CACHE_KEY, JSON.stringify(state)).catch(() => {});
  }, [sessionType, secondsLeft, isRunning, isBreak, startedAt, customDuration]);

  // ── Timer interval ─────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startedAt) {
          const elapsed = Math.floor((Date.now() - startedAt) / 1000);
          const remaining = totalSeconds - elapsed;
          if (remaining <= 0) {
            clearInterval(intervalRef.current);
            setSecondsLeft(0);
            handleTimerComplete(sessionType, isBreak, customDuration);
          } else {
            setSecondsLeft(remaining);
          }
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, startedAt, totalSeconds, sessionType, isBreak, customDuration]);

  function handleTimerComplete(type = sessionType, breakMode = isBreak, custDur = customDuration) {
    setIsRunning(false);
    setStartedAt(null);

    if (!breakMode) {
      const sessionPoints = type.points || 10;
      dispatch({ type: 'COMPLETE_SESSION', payload: sessionPoints });
      setSessionsCompleted(prev => prev + 1);

      const dur = type.id === 'custom' ? custDur : type.duration;

      // Add to today's history
      const newSession = {
        type: type.id,
        label: type.label,
        duration: dur,
        points: sessionPoints,
        completedAt: new Date().toISOString(),
      };
      setSessionHistory(prev => [...prev, newSession]);

      // Persist to Firestore
      if (isAuthenticated && user) {
        saveFocusSession(user.uid, newSession)
          .catch(e => console.log('Session save error:', e.message));
      }

      // Send completion notification
      sendTimerCompleteNotification(type.label, sessionPoints)
        .catch(e => console.log('Notification error:', e.message));

      // Transition to break
      setIsBreak(true);
      setSecondsLeft(DEFAULT_BREAK_MINUTES * 60);
    } else {
      // Break completed — back to focus mode
      setIsBreak(false);
      const dur = type.id === 'custom' ? custDur : type.duration;
      setSecondsLeft(dur * 60);
    }
  }

  const startTimer = useCallback(() => {
    setStartedAt(Date.now());
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    // When pausing, save the remaining seconds rather than the start time
    if (startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(totalSeconds - elapsed, 0);
      setSecondsLeft(remaining);
    }
    setIsRunning(false);
    setStartedAt(null);
  }, [startedAt, totalSeconds]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setStartedAt(null);
    setIsBreak(false);
    const dur = sessionType.id === 'custom' ? customDuration : sessionType.duration;
    setSecondsLeft(dur * 60);
  }, [sessionType, customDuration]);

  const changeSession = useCallback((type) => {
    setIsRunning(false);
    setStartedAt(null);
    setIsBreak(false);
    setSessionType(type);
    const dur = type.id === 'custom' ? customDuration : type.duration;
    setSecondsLeft(dur * 60);
  }, [customDuration]);

  const setCustomTimerDuration = useCallback((minutes) => {
    const clamped = Math.max(5, Math.min(120, minutes));
    setCustomDuration(clamped);
    if (sessionType.id === 'custom' && !isRunning) {
      setSecondsLeft(clamped * 60);
    }
  }, [sessionType, isRunning]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <TimerContext.Provider value={{
      sessionType, secondsLeft, isRunning, isBreak,
      sessionsCompleted, progress, displayTime, totalSeconds,
      sessionHistory, customDuration,
      startTimer, pauseTimer, resetTimer, changeSession,
      setCustomTimerDuration,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
