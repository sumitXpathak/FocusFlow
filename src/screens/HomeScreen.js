import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import ScreenTimeRing from '../components/ScreenTimeRing';
import StreakBanner from '../components/StreakBanner';
import AppUsageCard from '../components/AppUsageCard';

export default function HomeScreen() {
  const {
    screenTimeToday, screenTimePercent, remainingMinutes,
    dailyGoalHours, focusSessionsToday, pointsToday,
    streak, apps, blockingEnabled, dispatch,
  } = useApp();

  const hrs = Math.floor(screenTimeToday / 60);
  const mins = screenTimeToday % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const remHrs = Math.floor(remainingMinutes / 60);
  const remMins = remainingMinutes % 60;
  const remStr = remHrs > 0 ? `${remHrs}h ${remMins}m` : `${remMins}m`;
  const onTrack = screenTimePercent < 90;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>Alex's Dashboard</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.black} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AK</Text>
            </View>
          </View>
        </View>

        {/* Streak Banner */}
        <StreakBanner streak={streak} />

        {/* Screen Time Ring */}
        <View style={[styles.card, styles.ringCard]}>
          <View style={styles.ringTitleRow}>
            <Text style={styles.sectionLabel}>SCREEN TIME TODAY</Text>
            <View style={[styles.badge, onTrack ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={[styles.badgeText, { color: onTrack ? '#1A7A45' : '#A32D2D' }]}>
                {onTrack ? 'On track' : 'Over limit'}
              </Text>
            </View>
          </View>
          <View style={styles.ringRow}>
            <ScreenTimeRing percent={screenTimePercent} timeStr={timeStr} />
            <View style={styles.ringInfo}>
              <Text style={styles.ringMain}>{timeStr}</Text>
              <Text style={styles.ringSub}>of screen time used</Text>
              <Text style={[styles.ringGoal, { marginTop: 10 }]}>
                <Text style={{ fontWeight: '700', color: COLORS.black }}>
                  {dailyGoalHours}h Daily Goal{'\n'}
                </Text>
                Stay under goal to keep streak
              </Text>
              <View style={styles.remBadge}>
                <Text style={styles.remText}>{remStr} remaining</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Goal Cards */}
        <View style={styles.goalRow}>
          <View style={[styles.goalCard, styles.card]}>
            <Text style={styles.goalEmoji}>🎯</Text>
            <Text style={styles.goalVal}>{focusSessionsToday}</Text>
            <Text style={styles.goalLabel}>Focus sessions</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(focusSessionsToday / 5) * 100}%`, backgroundColor: COLORS.green }]} />
            </View>
          </View>
          <View style={[styles.goalCard, styles.card]}>
            <Text style={styles.goalEmoji}>⭐</Text>
            <Text style={styles.goalVal}>+{pointsToday}</Text>
            <Text style={styles.goalLabel}>Points earned</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(pointsToday / 150) * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Blocking Banner */}
        <TouchableOpacity
          style={styles.blockBanner}
          onPress={() => dispatch({ type: 'TOGGLE_BLOCKING' })}
          activeOpacity={0.85}
        >
          <View style={styles.blockIcon}>
            <Text style={{ fontSize: 22 }}>📵</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockTitle}>
              App blocking {blockingEnabled ? 'active' : 'off'}
            </Text>
            <Text style={styles.blockSub}>
              {apps.filter(a => a.blocked).length} apps blocked during focus hours
            </Text>
          </View>
          <Text style={styles.blockOn}>{blockingEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>

        {/* App Usage */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>App usage</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {apps.slice(0, 4).map(app => (
          <AppUsageCard key={app.id} app={app} />
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SIZES.padding,
    paddingTop: 12, paddingBottom: 8,
  },
  greeting: { fontSize: SIZES.sm, color: COLORS.gray },
  name: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.black, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    ...SHADOWS.card,
  },
  ringCard: { marginHorizontal: SIZES.padding, marginBottom: 12, padding: 18 },
  ringTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, letterSpacing: 0.5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeGreen: { backgroundColor: COLORS.greenLight },
  badgeRed: { backgroundColor: '#FCEBEB' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringInfo: { flex: 1 },
  ringMain: { fontSize: 24, fontWeight: '700', color: COLORS.black, letterSpacing: -0.5 },
  ringSub: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  ringGoal: { fontSize: 11, color: COLORS.gray, lineHeight: 18 },
  remBadge: {
    backgroundColor: COLORS.orangeLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start',
  },
  remText: { fontSize: 10, fontWeight: '600', color: COLORS.orange },
  goalRow: {
    flexDirection: 'row', marginHorizontal: SIZES.padding,
    gap: 10, marginBottom: 12,
  },
  goalCard: { flex: 1, padding: 14 },
  goalEmoji: { fontSize: 20, marginBottom: 4 },
  goalVal: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  goalLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  barTrack: {
    backgroundColor: COLORS.grayLight, borderRadius: 4,
    height: 5, marginTop: 8, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.orange },
  blockBanner: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.orange, borderRadius: SIZES.radius,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  blockIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  blockTitle: { fontSize: 13, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  blockSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  blockOn: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SIZES.padding,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  seeAll: { fontSize: 12, fontWeight: '500', color: COLORS.orange },
});
