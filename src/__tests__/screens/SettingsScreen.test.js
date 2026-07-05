import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../../screens/SettingsScreen';
import { AppProvider } from '../../context/AppContext';
import { TimerProvider } from '../../context/TimerContext';

const Wrapper = ({ children }) => (
  <AppProvider>
    <TimerProvider>{children}</TimerProvider>
  </AppProvider>
);

const renderSettings = () => render(<SettingsScreen />, { wrapper: Wrapper });

describe('SettingsScreen', () => {

  describe('Rendering', () => {
    it('renders Settings heading', () => {
      renderSettings();
      expect(screen.getByText('Settings')).toBeTruthy();
    });

    it('renders profile name', () => {
      renderSettings();
      // Name comes from the auth profile; falls back to "User" when signed out.
      expect(screen.getByText('User')).toBeTruthy();
    });

    it('renders profile level and points', () => {
      renderSettings();
      // New accounts start at level 1 with 0 points.
      expect(screen.getByText(/Level 1/)).toBeTruthy();
    });

    it('renders Edit button', () => {
      renderSettings();
      expect(screen.getByText('Edit')).toBeTruthy();
    });

    it('renders GOALS section label', () => {
      renderSettings();
      expect(screen.getByText('GOALS')).toBeTruthy();
    });

    it('renders daily screen time goal setting', () => {
      renderSettings();
      expect(screen.getByText('Daily screen time goal')).toBeTruthy();
      expect(screen.getByText('3 hrs')).toBeTruthy();
    });

    it('renders focus session length setting', () => {
      renderSettings();
      expect(screen.getByText('Focus session length')).toBeTruthy();
      expect(screen.getByText('25 min')).toBeTruthy();
    });

    it('renders break duration setting', () => {
      renderSettings();
      expect(screen.getByText('Break duration')).toBeTruthy();
      expect(screen.getByText('5 min')).toBeTruthy();
    });

    it('renders NOTIFICATIONS section label', () => {
      renderSettings();
      expect(screen.getByText('NOTIFICATIONS')).toBeTruthy();
    });

    it('renders push notifications toggle', () => {
      renderSettings();
      expect(screen.getByText('Push notifications')).toBeTruthy();
    });

    it('renders bedtime mode toggle', () => {
      renderSettings();
      expect(screen.getByText('Bedtime mode')).toBeTruthy();
    });

    it('renders strict blocking toggle', () => {
      renderSettings();
      expect(screen.getByText('Strict blocking')).toBeTruthy();
    });

    it('renders APP BLOCKING section', () => {
      renderSettings();
      expect(screen.getByText('APP BLOCKING')).toBeTruthy();
    });

    it('renders blocking enabled toggle', () => {
      renderSettings();
      expect(screen.getByText('Blocking enabled')).toBeTruthy();
    });

    it('renders manage blocked apps row', () => {
      renderSettings();
      expect(screen.getByText('Manage blocked apps')).toBeTruthy();
    });

    it('renders blocking schedule row', () => {
      renderSettings();
      expect(screen.getByText('Blocking schedule')).toBeTruthy();
      expect(screen.getByText('Manage →')).toBeTruthy();
    });

    it('renders MORE section', () => {
      renderSettings();
      expect(screen.getByText('MORE')).toBeTruthy();
    });

    it('renders share progress row', () => {
      renderSettings();
      expect(screen.getByText('Share progress')).toBeTruthy();
    });

    it('renders rate the app row', () => {
      renderSettings();
      expect(screen.getByText('Rate the app')).toBeTruthy();
    });

    it('renders help and support row', () => {
      renderSettings();
      expect(screen.getByText('Help & Support')).toBeTruthy();
    });

    it('renders AI recommendations card', () => {
      renderSettings();
      expect(screen.getByText(/Get personalised AI tips/i)).toBeTruthy();
    });

    it('renders reset all data button', () => {
      renderSettings();
      expect(screen.getByText('Reset all data')).toBeTruthy();
    });

    it('renders version text', () => {
      renderSettings();
      expect(screen.getByText(/FocusFlow v1.0.0/)).toBeTruthy();
    });
  });

  describe('Toggle Interactions', () => {
    it('notifications toggle is present and on by default', () => {
      renderSettings();
      const switches = screen.getAllByRole('switch');
      // First switch is Push notifications — value true
      expect(switches[0].props.value).toBe(true);
    });

    it('bedtime mode toggle is present and off by default', () => {
      renderSettings();
      const switches = screen.getAllByRole('switch');
      // Second switch is Bedtime mode — value false
      expect(switches[1].props.value).toBe(false);
    });

    it('strict blocking toggle is present and on by default', () => {
      renderSettings();
      const switches = screen.getAllByRole('switch');
      // Third switch is Strict blocking — value true
      expect(switches[2].props.value).toBe(true);
    });

    it('renders correct number of toggles', () => {
      renderSettings();
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(3);
    });

    it('toggles can be interacted with', () => {
      renderSettings();
      const switches = screen.getAllByRole('switch');
      fireEvent(switches[1], 'valueChange', true);
      expect(switches[1]).toBeTruthy();
    });
  });
});
