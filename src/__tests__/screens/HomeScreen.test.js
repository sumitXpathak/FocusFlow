import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';
import { AppProvider } from '../../context/AppContext';
import { TimerProvider } from '../../context/TimerContext';

const Wrapper = ({ children }) => (
  <AppProvider>
    <TimerProvider>{children}</TimerProvider>
  </AppProvider>
);

const renderHome = () =>
  render(<HomeScreen />, { wrapper: Wrapper });

describe('HomeScreen', () => {

  describe('Rendering', () => {
    it('renders the dashboard heading', () => {
      renderHome();
      expect(screen.getByText("Alex's Dashboard")).toBeTruthy();
    });

    it('renders the greeting text', () => {
      renderHome();
      expect(screen.getByText('Good morning')).toBeTruthy();
    });

    it('renders the screen time section label', () => {
      renderHome();
      expect(screen.getByText('SCREEN TIME TODAY')).toBeTruthy();
    });

    it('renders daily goal text', () => {
      renderHome();
      expect(screen.getByText(/Daily Goal/i)).toBeTruthy();
    });

    it('renders focus sessions count', () => {
      renderHome();
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('renders points earned today', () => {
      renderHome();
      expect(screen.getAllByText(/85/)[0]).toBeTruthy();
    });

    it('renders app usage section', () => {
      renderHome();
      expect(screen.getByText('App usage')).toBeTruthy();
    });

    it('renders Facebook in app list', () => {
      renderHome();
      expect(screen.getByText('Facebook')).toBeTruthy();
    });

    it('renders Instagram in app list', () => {
      renderHome();
      expect(screen.getByText('Instagram')).toBeTruthy();
    });

    it('renders YouTube in app list', () => {
      renderHome();
      expect(screen.getByText('YouTube')).toBeTruthy();
    });

    it('renders the blocked badge on blocked apps', () => {
      renderHome();
      const blockedBadges = screen.getAllByText('blocked');
      expect(blockedBadges.length).toBeGreaterThan(0);
    });

    it('shows on track badge when under limit', () => {
      renderHome();
      expect(screen.getByText(/On track/i)).toBeTruthy();
    });

    it('renders See all button', () => {
      renderHome();
      expect(screen.getByText(/See all/i)).toBeTruthy();
    });

    it('renders app blocking status card', () => {
      renderHome();
      expect(screen.getByText(/App blocking/i)).toBeTruthy();
    });
  });

  describe('App Blocking Toggle', () => {
    it('shows ON when blocking is enabled', () => {
      renderHome();
      expect(screen.getByText('ON')).toBeTruthy();
    });

    it('toggles blocking off when banner is pressed', () => {
      renderHome();
      fireEvent.press(screen.getByText('ON'));
      expect(screen.getByText('OFF')).toBeTruthy();
    });

    it('toggles blocking back on when pressed again', () => {
      renderHome();
      fireEvent.press(screen.getByText('ON'));
      fireEvent.press(screen.getByText('OFF'));
      expect(screen.getByText('ON')).toBeTruthy();
    });
  });

  describe('Screen Time Display', () => {
    it('displays screen time in correct format', () => {
      renderHome();
      expect(screen.getAllByText('1h 12m')[0]).toBeTruthy();
    });

    it('displays remaining time', () => {
      renderHome();
      expect(screen.getByText(/remaining/i)).toBeTruthy();
    });
  });

  describe('Streak Banner', () => {
    it('renders streak count', () => {
      renderHome();
      expect(screen.getByText(/45.*day streak/i)).toBeTruthy();
    });

    it('renders streak motivational text', () => {
      renderHome();
      expect(screen.getByText(/Meet your screen time goal every day/i)).toBeTruthy();
    });
  });
});
