// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

// Notification channel IDs
const CHANNELS = {
  DEFAULT: 'default',
  FOCUS: 'focus-reminders',
  STREAK: 'streak-alerts',
  GOALS: 'goal-notifications',
  REPORTS: 'weekly-reports',
};

// Notification identifiers for targeted cancellation
const NOTIF_IDS = {
  DAILY_REMINDER: 'daily-goal-reminder',
  FOCUS_NUDGE: 'focus-nudge',
  STREAK_RISK: 'streak-at-risk',
  TIMER_COMPLETE: 'timer-complete',
  WEEKLY_REPORT: 'weekly-report',
};

// ── Ensure Android notification channels exist ─
async function ensureChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNELS.DEFAULT, {
    name:             'General',
    importance:       Notifications.AndroidImportance.MAX,
    sound:            'default',
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.FOCUS, {
    name:       'Focus Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound:      'default',
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.STREAK, {
    name:       'Streak Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound:      'default',
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.GOALS, {
    name:       'Goal Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound:      'default',
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.REPORTS, {
    name:       'Weekly Reports',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound:      'default',
  });
}

// ── Request permissions ───────────────────────
export async function requestNotificationPermissions() {
  await ensureChannels();

  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

// ── Cancel a specific notification by identifier ──
async function cancelNotificationById(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (_) {
    // Notification may not exist — ignore
  }
}

// ── Schedule daily goal reminder ──────────────
export async function scheduleDailyReminder(hour = 20, minute = 0) {
  await ensureChannels();
  // Cancel only the daily reminder, not all notifications
  await cancelNotificationById(NOTIF_IDS.DAILY_REMINDER);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.DAILY_REMINDER,
    content: {
      title: '🎯 Check your screen time!',
      body:  "Don't forget to meet today's goal and keep your streak alive 🔥",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNELS.DEFAULT,
    },
  });
}

// ── Cancel daily reminder ─────────────────────
export async function cancelDailyReminder() {
  await cancelNotificationById(NOTIF_IDS.DAILY_REMINDER);
}

// ── Schedule focus session reminder ───────────
export async function scheduleFocusReminder(minutes = 120) {
  await ensureChannels();
  await cancelNotificationById(NOTIF_IDS.FOCUS_NUDGE);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.FOCUS_NUDGE,
    content: {
      title: '⏱ Time for a focus session!',
      body:  `You haven't focused in a while. Start a session to earn points!`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: CHANNELS.FOCUS,
    },
  });
}

// ── Cancel focus reminder ─────────────────────
export async function cancelFocusReminder() {
  await cancelNotificationById(NOTIF_IDS.FOCUS_NUDGE);
}

// ── Schedule streak-at-risk reminder ──────────
// Fires at the specified evening hour if the user hasn't met their goal
export async function scheduleStreakReminder(hour = 21, minute = 0) {
  await ensureChannels();
  await cancelNotificationById(NOTIF_IDS.STREAK_RISK);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.STREAK_RISK,
    content: {
      title: '🔥 Your streak is at risk!',
      body:  "You haven't met today's screen time goal yet. Stay on track to keep your streak alive!",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNELS.STREAK,
    },
  });
}

// ── Cancel streak reminder ────────────────────
export async function cancelStreakReminder() {
  await cancelNotificationById(NOTIF_IDS.STREAK_RISK);
}

// ── Send timer completion notification ────────
export async function sendTimerCompleteNotification(sessionType, points) {
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.TIMER_COMPLETE,
    content: {
      title: '🎉 Focus session complete!',
      body:  `Great work! You earned +${points} points from your ${sessionType} session.`,
      sound: 'default',
    },
    trigger: null, // immediate
  });
}

// ── Send goal reached notification ────────────
export async function sendGoalReachedNotification() {
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 Daily goal achieved!',
      body:  "You've met your screen time goal today. Your streak continues! 🔥",
      sound: 'default',
    },
    trigger: null, // immediate
  });
}

// ── Send level up notification ────────────────
export async function sendLevelUpNotification(newLevel) {
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⬆️ Level up!',
      body:  `Congratulations! You've reached Level ${newLevel}. Keep going!`,
      sound: 'default',
    },
    trigger: null,
  });
}

// ── Send badge unlock notification ────────────
export async function sendBadgeUnlockNotification(badgeName, badgeEmoji) {
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${badgeEmoji} Badge unlocked!`,
      body:  `You've earned the "${badgeName}" badge. Check your rewards!`,
      sound: 'default',
    },
    trigger: null,
  });
}

// ── Schedule weekly report notification ───────
export async function scheduleWeeklyReportReminder() {
  await ensureChannels();
  await cancelNotificationById(NOTIF_IDS.WEEKLY_REPORT);

  // Sunday at 7 PM
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDS.WEEKLY_REPORT,
    content: {
      title: '📊 Your weekly report is ready!',
      body:  'Check your insights to see how you did this week.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 19,
      minute: 0,
      channelId: CHANNELS.REPORTS,
    },
  });
}

// ── Send instant notification ─────────────────
export async function sendInstantNotification(title, body) {
  await ensureChannels();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: null,
  });
}

// ── Cancel all ────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Export notification IDs and channels ───────
export { NOTIF_IDS, CHANNELS };
