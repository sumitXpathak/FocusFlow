# FocusFlow 📵🔥
### Screen Time Control & Focus Rewards App
> Built for the 8x hackathon · Reference app: BePresent

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)

### Install & Run
```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start

# 3. Scan the QR code with Expo Go on your phone
```

---

## 📁 Project Structure

```
FocusFlow/
├── App.js                          # Root entry point
├── app.json                        # Expo config
├── package.json                    # Dependencies
├── babel.config.js
├── ai-logs/
│   └── ai-conversation-log.md     # 8x submission AI logs ✅
└── src/
    ├── navigation/
    │   └── AppNavigator.js         # Bottom tab navigation
    ├── context/
    │   ├── AppContext.js           # Global state (points, streak, apps)
    │   └── TimerContext.js         # Pomodoro timer state
    ├── screens/
    │   ├── HomeScreen.js           # Dashboard
    │   ├── FocusScreen.js          # Focus timer
    │   ├── RewardsScreen.js        # XP, badges, challenges
    │   ├── InsightsScreen.js       # Charts & weekly report
    │   └── SettingsScreen.js       # App settings
    ├── components/
    │   ├── StreakBanner.js          # Streak day tracker
    │   ├── ScreenTimeRing.js        # SVG ring chart
    │   └── AppUsageCard.js          # Per-app usage row
    └── constants/
        ├── theme.js                 # Colors, sizes, shadows
        └── data.js                  # Apps, sessions, badges
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `COLORS.background` | `#F5F0EB` | Warm cream — all screen backgrounds |
| `COLORS.orange` | `#FF6B35` | Primary accent — CTAs, progress, streak |
| `COLORS.black` | `#1A1A1A` | Dark cards — streak banner, timer card |
| `COLORS.white` | `#FFFFFF` | Content cards |
| `COLORS.green` | `#22C55E` | Under-limit indicator |
| `COLORS.red` | `#EF4444` | Over-limit indicator |

---

## ✨ Key Features

### 🏠 Home Dashboard
- Circular screen time ring with daily goal
- 45-day streak banner with day-dot tracker
- Per-app usage bars (color-coded: green/orange/red)
- App blocking status card

### ⏱ Focus Timer
- Pomodoro with SVG ring countdown
- Session types: Deep Work, Light Focus, Flow State, Custom
- App blocking toggle during sessions
- Points awarded on session completion

### 🏆 Rewards
- XP leveling system (Level 1–20+)
- Badge grid with locked/unlocked states
- Weekly & daily challenges
- Leaderboard ranking

### 📊 Insights
- Weekly bar chart with color coding
- Category donut chart (Social/Entertainment/Productivity/Other)
- Personalised AI insight tips
- Weekly report generator

### ⚙️ Settings
- Daily goal, session length, break duration config
- Push notifications, bedtime mode, strict blocking toggles
- Profile management

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | React Native runtime |
| `@react-navigation/bottom-tabs` | Tab navigation |
| `react-native-svg` | SVG ring charts |
| `@expo/vector-icons` | Ionicons tab icons |
| `@react-native-async-storage/async-storage` | Data persistence |
| `react-native-reanimated` | Smooth animations |

---

## 🔮 Next Steps to Complete

1. **Real app usage tracking** — Integrate iOS Screen Time API / Android UsageStatsManager via native module
2. **Push notifications** — Alert when approaching daily limit
3. **App blocking enforcement** — iOS Screen Time API `ManagedSettings` framework
4. **Backend/auth** — User accounts, cloud sync of streaks/points
5. **Animated transitions** — Reanimated 2 for card animations
6. **Onboarding flow** — Goal-setting wizard on first launch

---

*Reference apps: BePresent, FocusFlight, Focus Friend, Pushscroll*
