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

// ── Ensure Android notification channel exists ─
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:             'default',
      importance:       Notifications.AndroidImportance.MAX,
      sound:            'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

// ── Request permissions ───────────────────────
export async function requestNotificationPermissions() {
  // Channel must exist before/regardless of the permission prompt (Android 8+)
  await ensureAndroidChannel();

  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

// ── Schedule daily goal reminder ──────────────
export async function scheduleDailyReminder(hour = 20, minute = 0) {
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Check your screen time!',
      body:  "Don't forget to meet today's goal and keep your streak alive 🔥",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'default',
    },
  });
}

// ── Schedule focus session reminder ───────────
export async function scheduleFocusReminder(minutes = 30) {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏱ Time for a focus session!',
      body:  `You haven't focused in ${minutes} min. Start a session to earn points.`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: 'default',
    },
  });
}

// ── Send instant notification ─────────────────
export async function sendInstantNotification(title, body) {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: null,
  });
}

// ── Cancel all ────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
