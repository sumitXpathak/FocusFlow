import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { resetAllUserData } from '../services/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';

function SettingRow({ icon, label, value, onPress, isToggle, toggleVal, onToggle, color }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: color || COLORS.orangeLight }]}>
        <Ionicons name={icon} size={18} color={color ? COLORS.white : COLORS.orange} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {isToggle ? (
        <Switch
          value={toggleVal}
          onValueChange={onToggle}
          trackColor={{ false: '#E5E7EB', true: COLORS.orange }}
          thumbColor={COLORS.white}
        />
      ) : (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

export default function SettingsScreen({ navigation }) {
  const { blockingEnabled, dispatch, level, points, dailyGoalHours } = useApp();
  const { userProfile, isAuthenticated, user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [bedtimeMode, setBedtimeMode] = useState(false);
  const [strictBlocking, setStrictBlocking] = useState(true);

  const displayName = userProfile?.displayName || 'User';
  const email = userProfile?.email || user?.email || '';
  const initials = getInitials(displayName);

  async function handleLogout() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  }

  async function handleReset() {
    Alert.alert(
      'Reset all data',
      'This will permanently delete all your progress, sessions, and stats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset everything',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isAuthenticated && user) {
                await resetAllUserData(user.uid);
              }
              await AsyncStorage.removeItem('focusflow_state');
              dispatch({ type: 'RESET' });
              Alert.alert('Done', 'All data has been reset.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Manage your app</Text>
            <Text style={styles.name}>Settings</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, styles.card]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSub}>Level {level} · {points.toLocaleString()} pts</Text>
            {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editTxt}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Goals */}
        <Text style={styles.groupLabel}>GOALS</Text>
        <View style={[styles.group, styles.card]}>
          <SettingRow icon="time-outline"        label="Daily screen time goal"   value={`${dailyGoalHours} hrs`}  />
          <View style={styles.divider} />
          <SettingRow icon="play-circle-outline" label="Focus session length"     value="25 min" />
          <View style={styles.divider} />
          <SettingRow icon="cafe-outline"        label="Break duration"           value="5 min"  />
        </View>

        {/* Notifications */}
        <Text style={styles.groupLabel}>NOTIFICATIONS</Text>
        <View style={[styles.group, styles.card]}>
          <SettingRow
            icon="notifications-outline" label="Push notifications"
            isToggle toggleVal={notifications} onToggle={setNotifications}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="moon-outline" label="Bedtime mode"
            isToggle toggleVal={bedtimeMode} onToggle={setBedtimeMode}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="lock-closed-outline" label="Strict blocking"
            isToggle toggleVal={strictBlocking} onToggle={setStrictBlocking}
          />
        </View>

        {/* App Blocking */}
        <Text style={styles.groupLabel}>APP BLOCKING</Text>
        <View style={[styles.group, styles.card]}>
          <SettingRow
            icon="shield-checkmark-outline" label="Blocking enabled"
            isToggle toggleVal={blockingEnabled}
            onToggle={() => dispatch({ type: 'TOGGLE_BLOCKING' })}
          />
          <View style={styles.divider} />
          <SettingRow icon="apps-outline"     label="Manage blocked apps"  />
          <View style={styles.divider} />
          <SettingRow icon="calendar-outline" label="Blocking schedule" value="Manage →"
            onPress={() => navigation?.navigate('BlockingSchedules')} />
        </View>

        {/* More */}
        <Text style={styles.groupLabel}>MORE</Text>
        <View style={[styles.group, styles.card]}>
          <SettingRow icon="share-outline"  label="Share progress"   />
          <View style={styles.divider} />
          <SettingRow icon="star-outline"   label="Rate the app"     />
          <View style={styles.divider} />
          <SettingRow icon="help-circle-outline" label="Help & Support" />
        </View>

        {/* AI Recommendations */}
        <TouchableOpacity style={styles.aiCard} activeOpacity={0.85}>
          <Text style={styles.aiTitle}>Get personalised AI tips ↗</Text>
          <Text style={styles.aiSub}>Based on your usage patterns this week</Text>
        </TouchableOpacity>

        {/* Logout */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.orange} />
            <Text style={styles.logoutTxt}>Sign out</Text>
          </TouchableOpacity>
        )}

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetTxt}>Reset all data</Text>
        </TouchableOpacity>

        <Text style={styles.version}>FocusFlow v1.0.0 · Made with ❤️</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 12, paddingBottom: 8 },
  greeting: { fontSize: SIZES.sm, color: COLORS.gray },
  name: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.black, letterSpacing: -0.3 },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, ...SHADOWS.card },
  profileCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  profileName: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  profileSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  profileEmail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  editBtn: {
    backgroundColor: COLORS.grayLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  editTxt: { fontSize: 12, fontWeight: '600', color: COLORS.black },
  groupLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray,
    letterSpacing: 0.8, paddingHorizontal: SIZES.padding,
    marginBottom: 6, marginTop: 4,
  },
  group: { marginHorizontal: SIZES.padding, marginBottom: 12, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  settingIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 13, fontWeight: '600', color: COLORS.black, flex: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValue: { fontSize: 13, color: COLORS.gray },
  divider: { height: 0.5, backgroundColor: COLORS.grayLight, marginLeft: 58 },
  aiCard: {
    marginHorizontal: SIZES.padding, backgroundColor: COLORS.orange,
    borderRadius: SIZES.radius, padding: 16, marginBottom: 10,
  },
  aiTitle: { fontSize: 13, fontWeight: '700', color: COLORS.white, marginBottom: 3 },
  aiSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  logoutBtn: {
    marginHorizontal: SIZES.padding, borderRadius: SIZES.radius,
    padding: 14, alignItems: 'center', backgroundColor: COLORS.orangeLight,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  logoutTxt: { fontSize: 13, fontWeight: '700', color: COLORS.orange },
  resetBtn: {
    marginHorizontal: SIZES.padding, borderRadius: SIZES.radius,
    padding: 14, alignItems: 'center', backgroundColor: '#FEE2E2', marginBottom: 12,
  },
  resetTxt: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.gray, marginBottom: 8 },
});
