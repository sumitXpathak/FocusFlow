import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import {
  saveNotificationPrefs,
  getNotificationPrefs,
} from '../services/firestoreService';
import {
  scheduleDailyReminder,
  requestNotificationPermissions,
} from '../services/notificationService';

const TIME_OPTIONS = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '8:00 PM', '9:00 PM', '10:00 PM'];

function parseTime(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hour: 20, minute: 0 };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

export default function NotificationsScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [dailyReminder,   setDailyReminder]   = useState(true);
  const [focusNudge,      setFocusNudge]       = useState(true);
  const [streakAlert,     setStreakAlert]       = useState(true);
  const [goalAlert,       setGoalAlert]        = useState(true);
  const [weeklyReport,    setWeeklyReport]     = useState(false);
  const [selectedTime,    setSelectedTime]     = useState('8:00 PM');
  const [loaded,          setLoaded]           = useState(false);

  // Load saved preferences from Firestore
  useEffect(() => {
    if (isAuthenticated && user) {
      getNotificationPrefs(user.uid)
        .then(prefs => {
          if (prefs) {
            setDailyReminder(prefs.dailyReminder ?? true);
            setFocusNudge(prefs.focusNudge ?? true);
            setStreakAlert(prefs.streakAlert ?? true);
            setGoalAlert(prefs.goalAlert ?? true);
            setWeeklyReport(prefs.weeklyReport ?? false);
            setSelectedTime(prefs.reminderTime || '8:00 PM');
          }
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [isAuthenticated, user]);

  async function handleSave() {
    try {
      // Request notification permissions
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permissions needed', 'Please enable notifications in your device settings.');
        return;
      }

      // Schedule the daily reminder
      if (dailyReminder) {
        const { hour, minute } = parseTime(selectedTime);
        await scheduleDailyReminder(hour, minute);
      }

      // Save preferences to Firestore
      if (isAuthenticated && user) {
        await saveNotificationPrefs(user.uid, {
          dailyReminder,
          focusNudge,
          streakAlert,
          goalAlert,
          weeklyReport,
          reminderTime: selectedTime,
        });
      }

      Alert.alert('Saved!', 'Your notification preferences have been updated.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  const Row = ({ icon, iconBg, label, sub, value, onToggle }) => (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={COLORS.white} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: COLORS.orange }}
        thumbColor={COLORS.white}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Reminders */}
        <Text style={styles.section}>REMINDERS</Text>
        <View style={styles.card}>
          <Row
            icon="alarm-outline"     iconBg={COLORS.orange}
            label="Daily goal reminder"
            sub="Get reminded to check your screen time"
            value={dailyReminder}    onToggle={setDailyReminder}
          />
          <View style={styles.divider} />
          <Row
            icon="flash-outline"     iconBg="#6930C3"
            label="Focus nudge"
            sub="Alert if you haven't focused in 2+ hours"
            value={focusNudge}       onToggle={setFocusNudge}
          />
          <View style={styles.divider} />
          <Row
            icon="flame-outline"     iconBg="#EF4444"
            label="Streak at risk"
            sub="Warn when streak may break tonight"
            value={streakAlert}      onToggle={setStreakAlert}
          />
        </View>

        {/* Reminder time */}
        {dailyReminder && (
          <>
            <Text style={styles.section}>REMINDER TIME</Text>
            <View style={[styles.card, { padding: 14 }]}>
              <View style={styles.timeGrid}>
                {TIME_OPTIONS.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                    onPress={() => setSelectedTime(t)}
                  >
                    <Text style={[styles.timeChipTxt, selectedTime === t && styles.timeChipTxtActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Achievements */}
        <Text style={styles.section}>ACHIEVEMENTS</Text>
        <View style={styles.card}>
          <Row
            icon="trophy-outline"    iconBg={COLORS.black}
            label="Goal reached"
            sub="Celebrate when you meet your daily goal"
            value={goalAlert}        onToggle={setGoalAlert}
          />
          <View style={styles.divider} />
          <Row
            icon="bar-chart-outline" iconBg="#2D6A4F"
            label="Weekly report"
            sub="Summary every Sunday evening"
            value={weeklyReport}     onToggle={setWeeklyReport}
          />
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.orange} />
          <Text style={styles.infoTxt}>
            Notifications require permission. Make sure FocusFlow is allowed in your device Settings.
          </Text>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveTxt}>Save preferences</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingVertical: 12,
  },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.card },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  section:     { fontSize: 11, fontWeight: '700', color: COLORS.gray, letterSpacing: 0.8, paddingHorizontal: SIZES.padding, marginTop: 16, marginBottom: 6 },
  card:        { marginHorizontal: SIZES.padding, backgroundColor: COLORS.white, borderRadius: SIZES.radius, overflow: 'hidden', ...SHADOWS.card },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  rowIcon:     { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowBody:     { flex: 1 },
  rowLabel:    { fontSize: 13, fontWeight: '600', color: COLORS.black },
  rowSub:      { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  divider:     { height: 0.5, backgroundColor: COLORS.grayLight, marginLeft: 58 },
  timeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip:    { backgroundColor: COLORS.grayLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  timeChipActive: { backgroundColor: COLORS.orange },
  timeChipTxt: { fontSize: 12, fontWeight: '600', color: COLORS.black },
  timeChipTxtActive: { color: COLORS.white },
  infoCard:    { marginHorizontal: SIZES.padding, marginTop: 12, flexDirection: 'row', gap: 8, backgroundColor: COLORS.orangeLight, borderRadius: 12, padding: 12 },
  infoTxt:     { flex: 1, fontSize: 12, color: COLORS.orange, lineHeight: 18 },
  saveBtn:     { marginHorizontal: SIZES.padding, marginTop: 20, backgroundColor: COLORS.black, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  saveTxt:     { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
