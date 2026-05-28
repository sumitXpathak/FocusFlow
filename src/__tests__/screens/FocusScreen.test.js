import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import FocusScreen from '../../screens/FocusScreen';
import { AppProvider } from '../../context/AppContext';
import { TimerProvider } from '../../context/TimerContext';

const Wrapper = ({ children }) => (
  <AppProvider>
    <TimerProvider>{children}</TimerProvider>
  </AppProvider>
);

const renderFocus = () => render(<FocusScreen />, { wrapper: Wrapper });

describe('FocusScreen', () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── Rendering ───────────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders Focus Mode heading', () => {
      renderFocus();
      expect(screen.getByText('Focus Mode')).toBeTruthy();
    });

    it('renders POMODORO TIMER label', () => {
      renderFocus();
      expect(screen.getByText('POMODORO TIMER')).toBeTruthy();
    });

    it('renders initial timer at 25:00', () => {
      renderFocus();
      expect(screen.getByText('25:00')).toBeTruthy();
    });

    it('renders Start button initially', () => {
      renderFocus();
      expect(screen.getByText(/Start/i)).toBeTruthy();
    });

    it('renders Reset button', () => {
      renderFocus();
      expect(screen.getByText(/Reset/i)).toBeTruthy();
    });

    it('renders session type selector', () => {
      renderFocus();
      expect(screen.getByText('Deep Work')).toBeTruthy();
      expect(screen.getByText('Light Focus')).toBeTruthy();
      expect(screen.getByText('Flow State')).toBeTruthy();
    });

    it('renders App blocking section', () => {
      renderFocus();
      expect(screen.getByText('App blocking')).toBeTruthy();
    });

    it('renders session reward card', () => {
      renderFocus();
      expect(screen.getByText('Session reward')).toBeTruthy();
    });

    it('shows correct points for Deep Work session', () => {
      renderFocus();
      expect(screen.getByText('+15 pts/session')).toBeTruthy();
    });

    it('shows bonus points text', () => {
      renderFocus();
      expect(screen.getByText('+5 bonus if no blocks broken')).toBeTruthy();
    });

    it('renders blocked app pills', () => {
      renderFocus();
      expect(screen.getByText(/Instagram/i)).toBeTruthy();
    });
  });

  // ─── Timer Controls ──────────────────────────────────────────────
  describe('Timer Controls', () => {
    it('changes Start to Pause when pressed', () => {
      renderFocus();
      fireEvent.press(screen.getByText(/Start/i));
      expect(screen.getByText(/Pause/i)).toBeTruthy();
    });

    it('counts down after pressing Start', () => {
      renderFocus();
      fireEvent.press(screen.getByText(/Start/i));
      act(() => { jest.advanceTimersByTime(1000); });
      expect(screen.getByText('24:59')).toBeTruthy();
    });

    it('pauses timer when Pause is pressed', () => {
      renderFocus();
      fireEvent.press(screen.getByText(/Start/i));
      act(() => { jest.advanceTimersByTime(3000); });
      fireEvent.press(screen.getByText(/Pause/i));
      const timePaused = screen.getByText('24:57').props.children;
      act(() => { jest.advanceTimersByTime(3000); });
      expect(screen.getByText('24:57')).toBeTruthy();
    });

    it('resets timer to 25:00 when Reset is pressed', () => {
      renderFocus();
      fireEvent.press(screen.getByText(/Start/i));
      act(() => { jest.advanceTimersByTime(10000); });
      fireEvent.press(screen.getByText(/Reset/i));
      expect(screen.getByText('25:00')).toBeTruthy();
    });

    it('shows Start button again after reset', () => {
      renderFocus();
      fireEvent.press(screen.getByText(/Start/i));
      fireEvent.press(screen.getByText(/Reset/i));
      expect(screen.getByText(/Start/i)).toBeTruthy();
    });
  });

  // ─── Session Type Switching ──────────────────────────────────────
  describe('Session Type Switching', () => {
    it('switches to Light Focus (15:00) when selected', () => {
      renderFocus();
      fireEvent.press(screen.getByText('Light Focus'));
      expect(screen.getByText('15:00')).toBeTruthy();
    });

    it('switches to Flow State (50:00) when selected', () => {
      renderFocus();
      fireEvent.press(screen.getByText('Flow State'));
      expect(screen.getByText('50:00')).toBeTruthy();
    });

    it('updates session reward points when switching session type', () => {
      renderFocus();
      fireEvent.press(screen.getByText('Flow State'));
      expect(screen.getByText('+25 pts/session')).toBeTruthy();
    });

    it('stops timer when switching session type', () => {
      renderFocus();
      fireEvent.press(screen.getByText(/Start/i));
      act(() => { jest.advanceTimersByTime(3000); });
      fireEvent.press(screen.getByText('Light Focus'));
      expect(screen.getByText('15:00')).toBeTruthy();
    });
  });

  // ─── App Blocking Toggle ─────────────────────────────────────────
  describe('App Blocking Toggle', () => {
    it('renders blocking toggle', () => {
      renderFocus();
      expect(screen.getByText('App blocking')).toBeTruthy();
    });
  });
});
