import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { saveAppLimits } from '../services/firestoreService';

export default function AppLimitScreen({ navigation }) {
  const { apps, dispatch } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [limits, setLimits] = useState(
    Object.fromEntries(apps.map(a => [a.id, a.limit]))
  );

  function handleSave() {
    const updatedApps = apps.map(app => ({
      ...app,
      limit: limits[app.id],
    }));
    // Dispatch to local context
    apps.forEach(app => {
      dispatch({ type: 'SET_APP_LIMIT', payload: { id: app.id, limit: limits[app.id] } });
    });
    // Persist to Firestore
    if (isAuthenticated && user) {
      saveAppLimits(user.uid, updatedApps)
        .catch(e => console.log('Save limits error:', e.message));
    }
    Alert.alert('Saved!', 'App limits have been updated.');
    navigation?.goBack();
  }

  function formatTime(mins) {
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim();
    return `${mins}m`;
  }

  function getBarColor(used, limit) {
    const pct = (used / limit) * 100;
    if (pct >= 100) return COLORS.red;
    if (pct >= 80)  return COLORS.orange;
    return COLORS.green;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Limits</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnTxt}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>⏱</Text>
          <Text style={styles.infoTxt}>
            Set daily time limits for each app. You'll get a warning when approaching your limit.
          </Text>
        </View>

        {apps.map(app => {
          const limit = limits[app.id];
          const pct   = Math.min((app.used / limit) * 100, 100);
          const color = getBarColor(app.used, limit);
          return (
            <View key={app.id} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                  <Text style={{ fontSize: 22 }}>{app.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appUsed}>Used today: {formatTime(app.used)}</Text>
                </View>
                <View style={styles.limitBadge}>
                  <Text style={styles.limitBadgeTxt}>{formatTime(limit)}</Text>
                </View>
              </View>

              {/* Usage bar */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>

              {/* Slider */}
              <View style={styles.sliderRow}>
                <Text style={styles.sliderMin}>15m</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={15}
                  maximumValue={180}
                  step={15}
                  value={limit}
                  onValueChange={val => setLimits(prev => ({ ...prev, [app.id]: val }))}
                  minimumTrackTintColor={COLORS.orange}
                  maximumTrackTintColor={COLORS.grayLight}
                  thumbTintColor={COLORS.orange}
                />
                <Text style={styles.sliderMax}>3h</Text>
              </View>

              {/* Quick select */}
              <View style={styles.quickRow}>
                {[15, 30, 45, 60, 90, 120].map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.quickChip, limit === m && styles.quickChipActive]}
                    onPress={() => setLimits(prev => ({ ...prev, [app.id]: m }))}
                  >
                    <Text style={[styles.quickTxt, limit === m && styles.quickTxtActive]}>
                      {formatTime(m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

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
  saveBtn:     { backgroundColor: COLORS.orange, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7 },
  saveBtnTxt:  { fontSize: 13, fontWeight: '700', color: COLORS.white },
  infoCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.orangeLight, borderRadius: SIZES.radius,
    padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  infoEmoji: { fontSize: 20 },
  infoTxt:   { flex: 1, fontSize: 13, color: COLORS.orange, lineHeight: 20 },
  appCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 14, ...SHADOWS.card,
  },
  appHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  appIcon:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appName:     { fontSize: 14, fontWeight: '700', color: COLORS.black },
  appUsed:     { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  limitBadge:  { backgroundColor: COLORS.grayLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  limitBadgeTxt: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  barTrack:  { backgroundColor: COLORS.grayLight, borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 8 },
  barFill:   { height: '100%', borderRadius: 4 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sliderMin: { fontSize: 10, color: COLORS.gray, width: 24 },
  sliderMax: { fontSize: 10, color: COLORS.gray, width: 20 },
  slider:    { flex: 1, height: 36 },
  quickRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  quickChip: { backgroundColor: COLORS.grayLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  quickChipActive: { backgroundColor: COLORS.orange },
  quickTxt:  { fontSize: 11, fontWeight: '600', color: COLORS.black },
  quickTxtActive: { color: COLORS.white },
});
