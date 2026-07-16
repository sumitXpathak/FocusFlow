import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp } from '../../context/AppContext';

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
      // New users start clean; real point totals load from Firestore/AsyncStorage.
      expect(result.current.points).toBe(0);
    });

    it('loads with correct default streak', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.streak).toBe(0);
    });

    it('loads with empty apps list before native discovery', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      // Apps start empty — filled after native getInstalledApps() call
      expect(result.current.apps).toHaveLength(0);
    });

    it('loads with blocking enabled by default', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.blockingEnabled).toBe(true);
    });

    it('loads with focusActive as false', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.focusActive).toBe(false);
    });

    it('loads with empty schedules', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      expect(result.current.schedules).toHaveLength(0);
    });

    it('calculates screenTimePercent correctly', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      // 0 mins used / 180 mins goal = 0% before any usage is recorded
      expect(result.current.screenTimePercent).toBeCloseTo(0, 0);
    });

    it('calculates remainingMinutes correctly', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      // 180 min goal - 0 used = full 180 mins remaining
      expect(result.current.remainingMinutes).toBe(180);
    });
  });

  // ─── ADD_POINTS ──────────────────────────────────────────────────
  describe('ADD_POINTS action', () => {
    it('adds points to total', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 50 });
      });
      expect(result.current.points).toBe(50);
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
      expect(result.current.points).toBe(10000);
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
      expect(result.current.focusSessionsToday).toBe(3); // starts at 0, +3 sessions
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

  // ─── SET_FOCUS_ACTIVE ────────────────────────────────────────────
  describe('SET_FOCUS_ACTIVE action', () => {
    it('sets focusActive to true', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'SET_FOCUS_ACTIVE', payload: true });
      });
      expect(result.current.focusActive).toBe(true);
    });

    it('sets focusActive back to false', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      act(() => {
        result.current.dispatch({ type: 'SET_FOCUS_ACTIVE', payload: true });
        result.current.dispatch({ type: 'SET_FOCUS_ACTIVE', payload: false });
      });
      expect(result.current.focusActive).toBe(false);
    });
  });

  // ─── SET_SCHEDULES ───────────────────────────────────────────────
  describe('SET_SCHEDULES action', () => {
    it('sets schedules array', () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      const mockSchedules = [
        { id: '1', name: 'Work', days: [0,1,2,3,4], startMinutes: 540, endMinutes: 1020, packages: ['com.test.app'], active: true },
      ];
      act(() => {
        result.current.dispatch({ type: 'SET_SCHEDULES', payload: mockSchedules });
      });
      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0].name).toBe('Work');
    });
  });

  // ─── AsyncStorage Persistence ────────────────────────────────────
  describe('AsyncStorage persistence', () => {
    it('saves state to AsyncStorage when points change', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });
      // Let the initial async load settle so profileLoaded flips true.
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        result.current.dispatch({ type: 'ADD_POINTS', payload: 100 });
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'focusflow_state',
        expect.stringContaining('"points":100')
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
