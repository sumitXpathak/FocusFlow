import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StreakBanner from '../../components/StreakBanner';
import AppUsageCard from '../../components/AppUsageCard';
import ScreenTimeRing from '../../components/ScreenTimeRing';
import { AppProvider } from '../../context/AppContext';

const Wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

// ═══════════════════════════════════════════════════════════════════
describe('StreakBanner', () => {

  it('renders streak count correctly', () => {
    render(<StreakBanner streak={45} />);
    expect(screen.getByText('45 Day Streak!')).toBeTruthy();
  });

  it('renders streak count of 1 correctly', () => {
    render(<StreakBanner streak={1} />);
    expect(screen.getByText('1 Day Streak!')).toBeTruthy();
  });

  it('renders streak count of 0', () => {
    render(<StreakBanner streak={0} />);
    expect(screen.getByText('0 Day Streak!')).toBeTruthy();
  });

  it('renders motivational sub text', () => {
    render(<StreakBanner streak={10} />);
    expect(screen.getByText('Meet your screen time goal every day')).toBeTruthy();
  });

  it('renders 7 day dots', () => {
    render(<StreakBanner streak={45} />);
    // The weekday strip always renders one column per day of the week.
    expect(screen.getAllByTestId('streak-day-col')).toHaveLength(7);
  });

  it('renders flame emoji', () => {
    render(<StreakBanner streak={5} />);
    expect(screen.getByText('🔥')).toBeTruthy();
  });

  it('renders with large streak numbers', () => {
    render(<StreakBanner streak={365} />);
    expect(screen.getByText('365 Day Streak!')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════
describe('AppUsageCard', () => {

  const baseApp = {
    id: '1',
    name: 'Facebook',
    icon: '📘',
    color: '#E8F0FE',
    limit: 45,
    used: 30,
    blocked: false,
  };

  it('renders app name', () => {
    render(<AppUsageCard app={baseApp} />, { wrapper: Wrapper });
    expect(screen.getByText('Facebook')).toBeTruthy();
  });

  it('renders usage time', () => {
    render(<AppUsageCard app={baseApp} />, { wrapper: Wrapper });
    expect(screen.getByText('30m')).toBeTruthy();
  });

  it('renders limit time', () => {
    render(<AppUsageCard app={baseApp} />, { wrapper: Wrapper });
    expect(screen.getByText('limit 45m')).toBeTruthy();
  });

  it('renders app icon', () => {
    render(<AppUsageCard app={baseApp} />, { wrapper: Wrapper });
    expect(screen.getByText('📘')).toBeTruthy();
  });

  it('shows blocked badge when app is blocked', () => {
    const blockedApp = { ...baseApp, blocked: true };
    render(<AppUsageCard app={blockedApp} />, { wrapper: Wrapper });
    expect(screen.getByText('blocked')).toBeTruthy();
  });

  it('does not show blocked badge when app is not blocked', () => {
    render(<AppUsageCard app={baseApp} />, { wrapper: Wrapper });
    expect(screen.queryByText('blocked')).toBeNull();
  });

  it('renders correctly when usage is over limit', () => {
    const overLimitApp = { ...baseApp, used: 60, limit: 45 };
    render(<AppUsageCard app={overLimitApp} />, { wrapper: Wrapper });
    expect(screen.getByText('60m')).toBeTruthy();
  });

  it('renders correctly at exact limit', () => {
    const atLimitApp = { ...baseApp, used: 45, limit: 45 };
    render(<AppUsageCard app={atLimitApp} />, { wrapper: Wrapper });
    expect(screen.getByText('45m')).toBeTruthy();
  });

  it('renders correctly with 0 usage', () => {
    const zeroApp = { ...baseApp, used: 0 };
    render(<AppUsageCard app={zeroApp} />, { wrapper: Wrapper });
    expect(screen.getByText('0m')).toBeTruthy();
  });

  it('renders different app names correctly', () => {
    const instaApp = { ...baseApp, name: 'Instagram', icon: '📸' };
    render(<AppUsageCard app={instaApp} />, { wrapper: Wrapper });
    expect(screen.getByText('Instagram')).toBeTruthy();
    expect(screen.getByText('📸')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════
describe('ScreenTimeRing', () => {

  it('renders without crashing', () => {
    const { toJSON } = render(<ScreenTimeRing percent={50} timeStr="1h 30m" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders time string', () => {
    const { toJSON } = render(<ScreenTimeRing percent={50} timeStr="1h 30m" />);
    expect(JSON.stringify(toJSON())).toContain('1h 30m');
  });

  it('renders "used today" label', () => {
    const { toJSON } = render(<ScreenTimeRing percent={50} timeStr="1h 30m" />);
    expect(JSON.stringify(toJSON())).toContain('used today');
  });

  it('renders at 0%', () => {
    const { toJSON } = render(<ScreenTimeRing percent={0} timeStr="0m" />);
    expect(JSON.stringify(toJSON())).toContain('0m');
  });

  it('renders at 100%', () => {
    const { toJSON } = render(<ScreenTimeRing percent={100} timeStr="3h" />);
    expect(JSON.stringify(toJSON())).toContain('3h');
  });

  it('renders over 100% without crashing', () => {
    const { toJSON } = render(<ScreenTimeRing percent={120} timeStr="3h 36m" />);
    expect(toJSON()).toBeTruthy();
  });
});
