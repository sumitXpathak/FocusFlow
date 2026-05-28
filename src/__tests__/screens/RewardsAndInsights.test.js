import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import RewardsScreen from '../../screens/RewardsScreen';
import InsightsScreen from '../../screens/InsightsScreen';
import { AppProvider } from '../../context/AppContext';
import { TimerProvider } from '../../context/TimerContext';

const Wrapper = ({ children }) => (
  <AppProvider>
    <TimerProvider>{children}</TimerProvider>
  </AppProvider>
);

const renderRewards  = () => render(<RewardsScreen />,  { wrapper: Wrapper });
const renderInsights = () => render(<InsightsScreen />, { wrapper: Wrapper });

describe('RewardsScreen', () => {

  describe('Rendering', () => {
    it('renders Rewards heading', () => {
      renderRewards();
      expect(screen.getByText('Rewards')).toBeTruthy();
    });

    it('renders XP level text', () => {
      renderRewards();
      expect(screen.getByText(/LEVEL 8/i)).toBeTruthy();
    });

    it('renders XP progress text', () => {
      renderRewards();
      expect(screen.getAllByText(/1,240/)[0]).toBeTruthy();
    });

    it('renders XP to next level', () => {
      renderRewards();
      expect(screen.getByText(/260.*XP to Level/i)).toBeTruthy();
    });

    it('renders leaderboard rank', () => {
      renderRewards();
      expect(screen.getAllByText(/Top 12%/)[0]).toBeTruthy();
    });

    it('renders streak card', () => {
      renderRewards();
      expect(screen.getByText(/45.*Day Streak/i)).toBeTruthy();
    });

    it('renders Badges section', () => {
      renderRewards();
      expect(screen.getByText('Badges')).toBeTruthy();
    });

    it('renders unlocked Laser Focus badge', () => {
      renderRewards();
      expect(screen.getByText('Laser Focus')).toBeTruthy();
    });

    it('renders unlocked Digital Detox badge', () => {
      renderRewards();
      expect(screen.getByText('Digital Detox')).toBeTruthy();
    });

    it('renders locked Night Owl badge', () => {
      renderRewards();
      expect(screen.getByText('Night Owl')).toBeTruthy();
    });

    it('renders locked Focus Master badge', () => {
      renderRewards();
      expect(screen.getByText('Focus Master')).toBeTruthy();
    });

    it('renders Challenges section', () => {
      renderRewards();
      expect(screen.getByText('Challenges')).toBeTruthy();
    });

    it('renders weekly challenge', () => {
      renderRewards();
      expect(screen.getByText('Weekly challenge')).toBeTruthy();
    });

    it('renders focus marathon challenge', () => {
      renderRewards();
      expect(screen.getByText('Focus marathon')).toBeTruthy();
    });

    it('renders challenge reward points', () => {
      renderRewards();
      expect(screen.getByText(/200.*pts/i)).toBeTruthy();
    });

    it('renders leaderboard card', () => {
      renderRewards();
      expect(screen.getByText(/You're in the Top 12%/)).toBeTruthy();
    });

    it('renders points badge in header', () => {
      renderRewards();
      expect(screen.getByText(/1,240.*pts/)).toBeTruthy();
    });

    it('renders streak motivational text', () => {
      renderRewards();
      expect(screen.getByText(/You're on a roll/i)).toBeTruthy();
    });
  });

  describe('Challenges Progress', () => {
    it('shows weekly challenge progress 5/7', () => {
      renderRewards();
      expect(screen.getByText(/5.*of.*7.*done/)).toBeTruthy();
    });

    it('shows focus marathon progress 2/5', () => {
      renderRewards();
      expect(screen.getByText(/2.*of.*5.*done/)).toBeTruthy();
    });

    it('shows remaining days for weekly challenge', () => {
      renderRewards();
      expect(screen.getAllByText(/2.*remaining/)[0]).toBeTruthy();
    });
  });

  describe('Interactivity', () => {
    it('renders View all badges button', () => {
      renderRewards();
      expect(screen.getByText(/View all/i)).toBeTruthy();
    });

    it('renders View leaderboard button', () => {
      renderRewards();
      expect(screen.getByText('View')).toBeTruthy();
    });
  });
});

describe('InsightsScreen', () => {

  describe('Rendering', () => {
    it('renders Insights heading', () => {
      renderInsights();
      expect(screen.getByText('Insights')).toBeTruthy();
    });

    it('renders This Week tab', () => {
      renderInsights();
      expect(screen.getByText('This Week')).toBeTruthy();
    });

    it('renders This Month tab', () => {
      renderInsights();
      expect(screen.getByText('This Month')).toBeTruthy();
    });

    it('renders average daily stat', () => {
      renderInsights();
      expect(screen.getByText('Avg daily')).toBeTruthy();
    });

    it('renders goals met stat', () => {
      renderInsights();
      expect(screen.getByText('Goals met')).toBeTruthy();
    });

    it('renders goals met value', () => {
      renderInsights();
      expect(screen.getByText(/\/\s*7/)).toBeTruthy();
    });

    it('renders percentage decrease vs last week', () => {
      renderInsights();
      expect(screen.getByText(/↓.*12%.*vs last week/i)).toBeTruthy();
    });

    it('renders bar chart title', () => {
      renderInsights();
      expect(screen.getByText(/Daily screen time/i)).toBeTruthy();
    });

    it('renders day labels in bar chart', () => {
      renderInsights();
      expect(screen.getByText('Mon')).toBeTruthy();
      expect(screen.getByText('Sun')).toBeTruthy();
    });

    it('renders category chart title', () => {
      renderInsights();
      expect(screen.getByText('Time by category')).toBeTruthy();
    });

    it('renders Social category', () => {
      renderInsights();
      expect(screen.getByText('Social')).toBeTruthy();
    });

    it('renders Entertainment category', () => {
      renderInsights();
      expect(screen.getByText('Entertainment')).toBeTruthy();
    });

    it('renders Productivity category', () => {
      renderInsights();
      expect(screen.getByText('Productivity')).toBeTruthy();
    });

    it('renders Social percentage at 42%', () => {
      renderInsights();
      expect(screen.getAllByText(/42/)[0]).toBeTruthy();
    });

    it('renders insight tip card', () => {
      renderInsights();
      expect(screen.getByText(/This week.*insight/i)).toBeTruthy();
    });

    it('renders generate weekly report button', () => {
      renderInsights();
      expect(screen.getByText(/Generate weekly report/i)).toBeTruthy();
    });

    it('renders chart legend items', () => {
      renderInsights();
      expect(screen.getByText('Today')).toBeTruthy();
      expect(screen.getByText('Over limit')).toBeTruthy();
      expect(screen.getByText('Under limit')).toBeTruthy();
    });
  });

  describe('Tab Switching', () => {
    it('switches to This Month tab when pressed', () => {
      renderInsights();
      fireEvent.press(screen.getByText('This Month'));
      expect(screen.getByText('This Month')).toBeTruthy();
    });

    it('switches back to This Week tab', () => {
      renderInsights();
      fireEvent.press(screen.getByText('This Month'));
      fireEvent.press(screen.getByText('This Week'));
      expect(screen.getByText('This Week')).toBeTruthy();
    });
  });
});
