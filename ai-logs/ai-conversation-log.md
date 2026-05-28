# FocusFlow — AI Conversation Logs

## Prompt
Design a mobile app UI for a screen time and focus productivity app similar to BePresent. It should include a dashboard with screen time tracking, a focus timer (Pomodoro), app blocking, rewards/gamification, and weekly usage insights. Use a warm cream background with orange accents.

## Response
Designed and built a full 5-screen React Native mobile app called FocusFlow with:
- Home dashboard with circular screen time ring, 45-day streak banner with dot tracker, daily goal progress, per-app usage bars with color coding (green/orange/red), and app blocking status card
- Focus screen with live Pomodoro countdown timer (SVG ring), session type selector (Deep Work, Light Focus, Flow State, Custom), app blocking toggle with pill list, and reward preview
- Rewards screen with XP level card, streak card, badge grid (locked/unlocked), and weekly/daily challenges with progress bars
- Insights screen with weekly bar chart, category donut chart (Social 42%, Entertainment 28%, Productivity 18%, Other 12%), and AI weekly report button
- Settings screen with profile card, goal configuration rows, notification toggles, strict blocking toggle, and AI recommendations CTA

---

## Prompt
Build the complete React Native project structure for the FocusFlow app including all screens, components, context/state management, navigation, and constants.

## Response
Generated full Expo React Native project with:

**Project structure:**
- `App.js` — Root entry with SafeAreaProvider, GestureHandlerRootView, AppProvider, TimerProvider
- `src/navigation/AppNavigator.js` — Bottom tab navigator with 5 tabs (Home, Focus, Rewards, Insights, Settings)
- `src/context/AppContext.js` — Global state with useReducer: apps, points, XP, streak, blocking, weekly data. Persisted with AsyncStorage.
- `src/context/TimerContext.js` — Pomodoro timer state with start/pause/reset, session type switching, auto break logic, point dispatch on completion
- `src/constants/theme.js` — Design tokens: COLORS, FONTS, SIZES, SHADOWS matching BePresent aesthetic
- `src/constants/data.js` — App data: DEFAULT_APPS, SESSION_TYPES, BADGES, CHALLENGES

**Screens:**
- `HomeScreen.js` — Dashboard with StreakBanner, ScreenTimeRing, goal cards, app blocking toggle, AppUsageCard list
- `FocusScreen.js` — Session type selector, SVG timer ring, pause/start/reset, app blocking toggle with pills, reward preview
- `RewardsScreen.js` — XP card with progress bar, streak card, badge grid (locked/unlocked), challenge cards, leaderboard teaser
- `InsightsScreen.js` — Weekly/monthly tab, bar chart, donut chart, insight tips card, weekly report button
- `SettingsScreen.js` — Profile card, goals, notifications, blocking, misc settings, AI CTA, reset

**Components:**
- `StreakBanner.js` — Black card with flame, streak count, day dots
- `ScreenTimeRing.js` — SVG circular progress ring
- `AppUsageCard.js` — White card with app icon, progress bar, blocked badge

**Key design decisions:**
- Cream background `#F5F0EB` with orange `#FF6B35` accents throughout
- Black `#1A1A1A` used for dark cards (streak banner, timer card, dark CTA buttons)
- Gamification: XP levels, streak tracking, badge unlocking, per-session point rewards, weekly challenges
- AsyncStorage persistence for points, streak, app settings
- Modular context architecture (AppContext for data, TimerContext for timer state)
