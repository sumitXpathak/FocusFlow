import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert, Share, Linking, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  saveAppSettings, getAppSettings,
  exportUserData, backupUserData,
  resetAllUserData,
} from '../services/firestoreService';
import { DEFAULT_FOCUS_MINUTES, DEFAULT_BREAK_MINUTES } from '../constants/data';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6];
const FOCUS_OPTIONS = [15, 25, 30, 45, 50, 60];
const BREAK_OPTIONS = [3, 5, 10, 15, 20];

export default function SettingsScreen({ navigation }) {
  const { user, userProfile, isAuthenticated, logout, updateDailyGoal, refreshProfile } = useAuth();
  const { apps, blockingEnabled, dispatch } = useApp();

  // Modal states
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showFocusPicker, setShowFocusPicker] = useState(false);
  const [showBreakPicker, setShowBreakPicker] = useState(false);

  // Settings state
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [bedtimeMode, setBedtimeMode] = useState(false);
  const [strictBlocking, setStrictBlocking] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(userProfile?.dailyGoalHours || 3);
  const [focusDuration, setFocusDuration] = useState(DEFAULT_FOCUS_MINUTES);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_MINUTES);
  const [loadedSettings, setLoadedSettings] = useState(false);

  // Load saved settings
  useEffect(() => {
    if (isAuthenticated && user) {
      getAppSettings(user.uid)
        .then(saved => {
          if (saved) {
            setNotificationsOn(saved.notificationsOn ?? true);
            setBedtimeMode(saved.bedtimeMode ?? false);
            setStrictBlocking(saved.strictBlocking ?? false);
            setFocusDuration(saved.focusDuration ?? DEFAULT_FOCUS_MINUTES);
            setBreakDuration(saved.breakDuration ?? DEFAULT_BREAK_MINUTES);
          }
          setLoadedSettings(true);
        })
        .catch(() => setLoadedSettings(true));
    } else {
      setLoadedSettings(true);
    }
  }, [isAuthenticated, user]);

  // Update goal from profile
  useEffect(() => {
    if (userProfile?.dailyGoalHours) {
      setSelectedGoal(userProfile.dailyGoalHours);
    }
  }, [userProfile]);

  // Persist settings changes
  const persistSettings = useCallback(async (updates) => {
    if (isAuthenticated && user) {
      try {
        await saveAppSettings(user.uid, {
          notificationsOn,
          bedtimeMode,
          strictBlocking,
          focusDuration,
          breakDuration,
          ...updates,
        });
      } catch (e) {
        console.log('Settings save error:', e.message);
      }
    }
  }, [isAuthenticated, user, notificationsOn, bedtimeMode, strictBlocking, focusDuration, breakDuration]);

  const handleNotifToggle = useCallback((val) => {
    setNotificationsOn(val);
    persistSettings({ notificationsOn: val });
  }, [persistSettings]);

  const handleBedtimeToggle = useCallback((val) => {
    setBedtimeMode(val);
    persistSettings({ bedtimeMode: val });
  }, [persistSettings]);

  const handleStrictToggle = useCallback((val) => {
    setStrictBlocking(val);
    persistSettings({ strictBlocking: val });
  }, [persistSettings]);

  const handleGoalSave = useCallback(async (goal) => {
    setSelectedGoal(goal);
    setShowGoalPicker(false);
    try {
      await updateDailyGoal(goal);
      Alert.alert('Updated', `Daily goal set to ${goal} hours.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, [updateDailyGoal]);

  const handleFocusSave = useCallback((mins) => {
    setFocusDuration(mins);
    setShowFocusPicker(false);
    persistSettings({ focusDuration: mins });
    Alert.alert('Updated', `Default focus session set to ${mins} minutes.`);
  }, [persistSettings]);

  const handleBreakSave = useCallback((mins) => {
    setBreakDuration(mins);
    setShowBreakPicker(false);
    persistSettings({ breakDuration: mins });
    Alert.alert('Updated', `Break duration set to ${mins} minutes.`);
  }, [persistSettings]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: 'FocusFlow',
        message: `I've been using FocusFlow to manage my screen time! ${userProfile?.streak || 0} day streak, Level ${userProfile?.level || 1}. Download it and join the focus movement! 🎯🔥`,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  }, [userProfile]);

  const handleRateApp = useCallback(() => {
    // Open Play Store - replace with actual package name
    Linking.openURL('https://play.google.com/store/apps/details?id=com.focusflow.app')
      .catch(() => Alert.alert('Info', 'Rate us on the Play Store!'));
  }, []);

  const handleHelp = useCallback(() => {
    Alert.alert(
      'Help & Support',
      'FocusFlow helps you manage your screen time and stay focused.\n\n'
      + '• Use the Focus tab to start Pomodoro sessions\n'
      + '• Track your screen time on the Home tab\n'
      + '• Set app limits in Settings → Manage blocked apps\n'
      + '• Create blocking schedules in Settings → Schedules\n'
      + '• Earn points and badges in the Rewards tab\n\n'
      + 'For support, contact: support@focusflow.app',
      [{ text: 'OK' }]
    );
  }, []);

  const handleExportData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign in required', 'Please sign in to export your data.');
      return;
    }
    try {
      const data = await exportUserData(user.uid);
      Alert.alert('Data Exported', `Your data has been exported successfully.\n\nIncludes:\n• ${data.sessions.length} sessions\n• ${data.dailyStats.length} daily stats\n• Profile & settings`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, [isAuthenticated, user]);

  const handleBackup = useCallback(async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign in required', 'Please sign in to backup your data.');
      return;
    }
    try {
      await backupUserData(user.uid);
      Alert.alert('Backup Complete', 'Your data has been backed up to the cloud.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, [isAuthenticated, user]);

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'This will reset all your progress, sessions, points, and streaks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isAuthenticated && user) {
                await resetAllUserData(user.uid);
                await refreshProfile();
              }
              Alert.alert('Reset Complete', 'All your data has been reset.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  }, [isAuthenticated, user, refreshProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  const displayName = userProfile?.displayName || user?.displayName || 'User';
  const initials = getInitials(displayName);
  const email = userProfile?.email || user?.email || '';
  const level = userProfile?.level || 1;
  const points = userProfile?.points || 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileSub}>{email}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelTxt}>Level {level} · {points} pts</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation?.navigate('ProfileEdit')}
            >
              <Text style={styles.editBtnTxt}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Focus Settings */}
        <Text style={styles.section}>FOCUS SETTINGS</Text>
        <View style={styles.card}>
          <Row
            icon="time-outline" iconBg={COLORS.orange}
            label="Daily screen time goal"
            sub={`${selectedGoal} hours per day`}
            onPress={() => setShowGoalPicker(true)}
          />
          <View style={styles.divider} />
          <Row
            icon="hourglass-outline" iconBg="#8B5CF6"
            label="Focus session length"
            sub={`${focusDuration} minutes`}
            onPress={() => setShowFocusPicker(true)}
          />
          <View style={styles.divider} />
          <Row
            icon="cafe-outline" iconBg="#06B6D4"
            label="Break duration"
            sub={`${breakDuration} minutes`}
            onPress={() => setShowBreakPicker(true)}
          />
        </View>

        {/* Blocking Settings */}
        <Text style={styles.section}>APP BLOCKING</Text>
        <View style={styles.card}>
          <Row
            icon="apps-outline" iconBg={COLORS.orange}
            label="Manage blocked apps"
            sub={`${apps.filter(a => a.blocked).length} apps blocked`}
            onPress={() => navigation?.navigate('AppLimits')}
          />
          <View style={styles.divider} />
          <Row
            icon="calendar-outline" iconBg="#22C55E"
            label="Blocking schedules"
            sub="Automatic time-based blocking"
            onPress={() => navigation?.navigate('BlockingSchedules')}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="shield-checkmark-outline" iconBg="#EF4444"
            label="Strict blocking"
            sub="Prevent unblocking during focus"
            value={strictBlocking}
            onToggle={handleStrictToggle}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="moon-outline" iconBg="#6930C3"
            label="Bedtime mode"
            sub="Block apps after bedtime"
            value={bedtimeMode}
            onToggle={handleBedtimeToggle}
          />
        </View>

        {/* Notifications */}
        <Text style={styles.section}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="notifications-outline" iconBg={COLORS.orange}
            label="Push notifications"
            sub="Reminders, alerts & celebrations"
            value={notificationsOn}
            onToggle={handleNotifToggle}
          />
          <View style={styles.divider} />
          <Row
            icon="options-outline" iconBg="#6930C3"
            label="Notification preferences"
            sub="Customize what you receive"
            onPress={() => navigation?.navigate('Notifications')}
          />
        </View>

        {/* Data */}
        <Text style={styles.section}>DATA & PRIVACY</Text>
        <View style={styles.card}>
          <Row icon="download-outline" iconBg="#2D6A4F" label="Export my data" sub="Download all your data" onPress={handleExportData} />
          <View style={styles.divider} />
          <Row icon="cloud-upload-outline" iconBg="#06B6D4" label="Backup to cloud" sub="Save data to your account" onPress={handleBackup} />
          <View style={styles.divider} />
          <Row icon="refresh-outline" iconBg="#EF4444" label="Reset all data" sub="Clear all progress" onPress={handleResetData} />
        </View>

        {/* General */}
        <Text style={styles.section}>GENERAL</Text>
        <View style={styles.card}>
          <Row icon="share-social-outline" iconBg={COLORS.orange} label="Share progress" sub="Show off your streak" onPress={handleShare} />
          <View style={styles.divider} />
          <Row icon="star-outline" iconBg="#FFD700" label="Rate FocusFlow" sub="Help us improve" onPress={handleRateApp} />
          <View style={styles.divider} />
          <Row icon="help-circle-outline" iconBg="#8B5CF6" label="Help & Support" sub="FAQs and contact" onPress={handleHelp} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
          <Text style={styles.logoutTxt}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>FocusFlow v1.0.0</Text>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Goal Picker Modal */}
      <PickerModal
        visible={showGoalPicker}
        title="Daily Screen Time Goal"
        options={GOAL_OPTIONS}
        selected={selectedGoal}
        formatLabel={(v) => `${v} hour${v !== 1 ? 's' : ''}`}
        onSelect={handleGoalSave}
        onClose={() => setShowGoalPicker(false)}
      />

      {/* Focus Duration Picker */}
      <PickerModal
        visible={showFocusPicker}
        title="Focus Session Length"
        options={FOCUS_OPTIONS}
        selected={focusDuration}
        formatLabel={(v) => `${v} minutes`}
        onSelect={handleFocusSave}
        onClose={() => setShowFocusPicker(false)}
      />

      {/* Break Duration Picker */}
      <PickerModal
        visible={showBreakPicker}
        title="Break Duration"
        options={BREAK_OPTIONS}
        selected={breakDuration}
        formatLabel={(v) => `${v} minutes`}
        onSelect={handleBreakSave}
        onClose={() => setShowBreakPicker(false)}
      />
    </SafeAreaView>
  );
}

// Reusable Row component — navigable
function Row({ icon, iconBg, label, sub, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.65}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={COLORS.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
    </TouchableOpacity>
  );
}

// Reusable toggle row
function ToggleRow({ icon, iconBg, label, sub, value, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={COLORS.white} />
      </View>
      <View style={{ flex: 1 }}>
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
}

// Picker modal
function PickerModal({ visible, title, options, selected, formatLabel, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.pickerGrid}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.pickerChip, selected === opt && styles.pickerChipActive]}
                onPress={() => onSelect(opt)}
              >
                <Text style={[styles.pickerChipTxt, selected === opt && styles.pickerChipTxtActive]}>
                  {formatLabel(opt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  title: {
    fontSize: 28, fontWeight: '800', color: COLORS.black,
    paddingHorizontal: SIZES.padding, paddingTop: 12, paddingBottom: 14,
    letterSpacing: -0.5,
  },
  profileCard: {
    marginHorizontal: SIZES.padding, marginBottom: 16,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 18, ...SHADOWS.card,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  profileSub: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  levelBadge: {
    backgroundColor: COLORS.orangeLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start',
  },
  levelTxt: { fontSize: 10, fontWeight: '600', color: COLORS.orange },
  editBtn: {
    backgroundColor: COLORS.grayLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  editBtnTxt: { fontSize: 12, fontWeight: '600', color: COLORS.black },
  section: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray,
    letterSpacing: 0.8, paddingHorizontal: SIZES.padding,
    marginTop: 4, marginBottom: 6,
  },
  card: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    overflow: 'hidden', ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  rowIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  rowSub: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  divider: { height: 0.5, backgroundColor: COLORS.grayLight, marginLeft: 56 },
  logoutBtn: {
    marginHorizontal: SIZES.padding, marginTop: 12,
    backgroundColor: '#FEE2E2', borderRadius: SIZES.radius,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logoutTxt: { fontSize: 14, fontWeight: '700', color: COLORS.red },
  version: {
    textAlign: 'center', fontSize: 11, color: COLORS.gray,
    marginTop: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 20, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalCancel: { fontSize: 15, color: COLORS.gray },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  pickerChip: {
    backgroundColor: COLORS.grayLight, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 14, minWidth: 90, alignItems: 'center',
  },
  pickerChipActive: { backgroundColor: COLORS.orange },
  pickerChipTxt: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  pickerChipTxtActive: { color: COLORS.white },
});
