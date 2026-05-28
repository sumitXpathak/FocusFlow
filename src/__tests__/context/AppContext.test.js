import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp } from '../../context/AppContext';
import { DEFAULT_APPS } from '../../constants/data';

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

describe('AppContext', () => {

  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  // ─── Initial State ───────────────────────────────────────────────
  describe('Initial State', () => {
    it('loads with correct default points', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.points).toBe(1240);
    });

    it('loads with correct default streak', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.streak).toBe(45);
    });

    it('loads with default apps list', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.apps).toHaveLength(DEFAULT_APPS.length);
    });

    it('loads with blocking enabled by default', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.blockingEnabled).toBe(true);
    });

    it('calculates screenTimePercent correctly', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      // 72 mins used / 180 mins goal = 40%
      expect(result.current.screenTimePercent).toBeCloseTo(40, 0);
    });

    it('calculates remainingMinutes correctly', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      // 180 - 72 = 108 mins remaining
      expect(result.current.remainingMinutes).toBe(108);
    });
  });

  // ─── ADD_POINTS ──────────────────────────────────────────────────
  describe('ADD_POINTS action', () => {
    it('adds points to total', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 50 });
      });
      expect(result.current.points).toBe(1290);
    });

    it('adds points to pointsToday', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.pointsToday;
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 30 });
      });
      expect(result.current.pointsToday).toBe(before + 30);
    });

    it('also increases XP by same amount', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const beforeXP = result.current.xp;
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 20 });
      });
      expect(result.current.xp).toBe(beforeXP + 20);
    });

    it('handles adding 0 points', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.points;
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 0 });
      });
      expect(result.current.points).toBe(before);
    });

    it('handles adding large point values', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 10000 });
      });
      expect(result.current.points).toBe(11240);
    });
  });

  // ─── COMPLETE_SESSION ────────────────────────────────────────────
  describe('COMPLETE_SESSION action', () => {
    it('increments focusSessionsToday by 1', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.focusSessionsToday;
      act(() => {
        result.current.dispatch({ type: 'COMPLETE_SESSION', payload: 15 });
      });
      expect(result.current.focusSessionsToday).toBe(before + 1);
    });

    it('awards correct points on session complete', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const before = result.current.points;
      act(() => {
        result.current.dispatch({ type: 'COMPLETE_SESSION', payload: 15 });
      });
      expect(result.current.points).toBe(before + 15);
    });

    it('multiple sessions stack correctly', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'COMPLETE_SESSION', payload: 15 });
        result.current.dispatch({ type: 'COMPLETE_SESSION', payload: 15 });
        result.current.dispatch({ type: 'COMPLETE_SESSION', payload: 15 });
      });
      expect(result.current.focusSessionsToday).toBe(6); // 3 default + 3 new
    });
  });

  // ─── TOGGLE_BLOCKING ─────────────────────────────────────────────
  describe('TOGGLE_BLOCKING action', () => {
    it('toggles blockingEnabled from true to false', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.blockingEnabled).toBe(true);
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_BLOCKING' });
      });
      expect(result.current.blockingEnabled).toBe(false);
    });

    it('toggles blockingEnabled back to true', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_BLOCKING' });
        result.current.dispatch({ type: 'TOGGLE_BLOCKING' });
      });
      expect(result.current.blockingEnabled).toBe(true);
    });
  });

  // ─── TOGGLE_APP_BLOCK ────────────────────────────────────────────
  describe('TOGGLE_APP_BLOCK action', () => {
    it('toggles a specific app blocked state', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const app = result.current.apps[0]; // Facebook - blocked: false
      const wasBlocked = app.blocked;
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_APP_BLOCK', payload: app.id });
      });
      const updated = result.current.apps.find(a => a.id === app.id);
      expect(updated.blocked).toBe(!wasBlocked);
    });

    it('does not affect other apps when toggling one', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const otherApps = result.current.apps.slice(1);
      const otherStates = otherApps.map(a => ({ id: a.id, blocked: a.blocked }));
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_APP_BLOCK', payload: result.current.apps[0].id });
      });
      otherStates.forEach(({ id, blocked }) => {
        const app = result.current.apps.find(a => a.id === id);
        expect(app.blocked).toBe(blocked);
      });
    });
  });

  // ─── SET_APP_LIMIT ───────────────────────────────────────────────
  describe('SET_APP_LIMIT action', () => {
    it('updates app limit correctly', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const app = result.current.apps[0];
      act(() => {
        result.current.dispatch({ type: 'SET_APP_LIMIT', payload: { id: app.id, limit: 90 } });
      });
      const updated = result.current.apps.find(a => a.id === app.id);
      expect(updated.limit).toBe(90);
    });

    it('does not change other app limits', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const firstApp = result.current.apps[0];
      const secondApp = result.current.apps[1];
      const originalLimit = secondApp.limit;
      act(() => {
        result.current.dispatch({ type: 'SET_APP_LIMIT', payload: { id: firstApp.id, limit: 99 } });
      });
      const updatedSecond = result.current.apps.find(a => a.id === secondApp.id);
      expect(updatedSecond.limit).toBe(originalLimit);
    });
  });

  // ─── AsyncStorage Persistence ────────────────────────────────────
  describe('AsyncStorage persistence', () => {
    it('saves state to AsyncStorage when points change', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 100 });
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'focusflow_state',
        expect.stringContaining('"points":1340')
      );
    });

    it('loads saved state from AsyncStorage on mount', async () => {
      const savedState = { points: 9999, streak: 100, blockingEnabled: false };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedState));
      const { result } = renderHook(() => useApp(), { wrapper });
      
      await act(async () => {
        await Promise.resolve();
      });
      
      expect(result.current.points).toBe(9999);
      expect(result.current.streak).toBe(100);
    });
  });
});
