import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { TimerProvider, useTimer } from '../../context/TimerContext';
import { AppProvider } from '../../context/AppContext';
import { SESSION_TYPES } from '../../constants/data';

const wrapper = ({ children }) => (
  <AppProvider>
    <TimerProvider>{children}</TimerProvider>
  </AppProvider>
);

describe('TimerContext', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('starts with default session type (Deep Work)', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      expect(result.current.sessionType.id).toBe('deep');
    });

    it('starts with timer not running', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      expect(result.current.isRunning).toBe(false);
    });

    it('starts with correct initial time for Deep Work (25:00)', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      expect(result.current.displayTime).toBe('25:00');
    });

    it('starts with 0 sessions completed', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      expect(result.current.sessionsCompleted).toBe(0);
    });

    it('starts with progress at 0', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      expect(result.current.progress).toBe(0);
    });

    it('starts not in break mode', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      expect(result.current.isBreak).toBe(false);
    });
  });

  describe('startTimer', () => {
    it('sets isRunning to true', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      expect(result.current.isRunning).toBe(true);
    });

    it('counts down seconds when running', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(1000); });
      expect(result.current.displayTime).toBe('24:59');
    });

    it('counts down 5 seconds correctly', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(5000); });
      expect(result.current.displayTime).toBe('24:55');
    });

    it('updates progress as timer counts down', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(60000); });
      expect(result.current.progress).toBeGreaterThan(0);
    });
  });

  describe('pauseTimer', () => {
    it('sets isRunning to false', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { result.current.pauseTimer(); });
      expect(result.current.isRunning).toBe(false);
    });

    it('stops countdown when paused', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(3000); });
      act(() => { result.current.pauseTimer(); });
      const timeAfterPause = result.current.displayTime;
      act(() => { jest.advanceTimersByTime(5000); });
      expect(result.current.displayTime).toBe(timeAfterPause);
    });

    it('can resume after pause', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(2000); });
      act(() => { result.current.pauseTimer(); });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(1000); });
      expect(result.current.displayTime).toBe('24:57');
    });
  });

  describe('resetTimer', () => {
    it('resets display time to full session duration', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(60000); });
      act(() => { result.current.resetTimer(); });
      expect(result.current.displayTime).toBe('25:00');
    });

    it('sets isRunning to false on reset', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { result.current.resetTimer(); });
      expect(result.current.isRunning).toBe(false);
    });

    it('resets progress to 0', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(60000); });
      act(() => { result.current.resetTimer(); });
      expect(result.current.progress).toBe(0);
    });
  });

  describe('changeSession', () => {
    it('changes session type to Light Focus', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      const lightFocus = SESSION_TYPES.find(s => s.id === 'light');
      act(() => { result.current.changeSession(lightFocus); });
      expect(result.current.sessionType.id).toBe('light');
    });

    it('updates display time when session changes to 15:00', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      const lightFocus = SESSION_TYPES.find(s => s.id === 'light');
      act(() => { result.current.changeSession(lightFocus); });
      expect(result.current.displayTime).toBe('15:00');
    });

    it('changes to Flow State (50 min) correctly', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      const flowState = SESSION_TYPES.find(s => s.id === 'flow');
      act(() => { result.current.changeSession(flowState); });
      expect(result.current.displayTime).toBe('50:00');
    });

    it('stops timer when session type changes', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      const lightFocus = SESSION_TYPES.find(s => s.id === 'light');
      act(() => { result.current.changeSession(lightFocus); });
      expect(result.current.isRunning).toBe(false);
    });

    it('resets progress to 0 on session change', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(60000); });
      const lightFocus = SESSION_TYPES.find(s => s.id === 'light');
      act(() => { result.current.changeSession(lightFocus); });
      expect(result.current.progress).toBe(0);
    });
  });

  describe('Session Completion', () => {
    it('switches to break mode after session completes', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(25 * 60 * 1000 + 1000); });
      expect(result.current.isBreak).toBe(true);
    });

    it('increments sessionsCompleted after full session', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(25 * 60 * 1000 + 1000); });
      expect(result.current.sessionsCompleted).toBeGreaterThanOrEqual(1);
    });

    it('shows break time after session completes', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(25 * 60 * 1000 + 1000); });
      expect(result.current.displayTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('returns to work mode after break completes', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(25 * 60 * 1000 + 1000); });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(5 * 60 * 1000 + 1000); });
      expect(result.current.isBreak).toBe(false);
    });
  });

  describe('displayTime formatting', () => {
    it('pads minutes with leading zero', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      expect(result.current.displayTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('always shows MM:SS format', () => {
      const { result } = renderHook(() => useTimer(), { wrapper });
      act(() => { result.current.startTimer(); });
      act(() => { jest.advanceTimersByTime(54000); });
      expect(result.current.displayTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
