import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function RewardsScreen() {
  const { points, level, xp, xpToNext, streak, badges, challenges } = useApp();
  const xpPercent = Math.min((xp / xpToNext) * 100, 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Keep it up!</Text>
            <Text style={styles.name}>Rewards</Text>
          </View>
          <View style={styles.ptsBadge}>
            <Text style={styles.ptsTxt}>⭐ {points.toLocaleString()} pts</Text>
          </View>
        </View>

        {/* XP Card */}
        <View style={styles.xpCard}>
          <Text style={styles.xpLevel}>LEVEL {level} — FOCUS CHAMPION</Text>
          <Text style={styles.xpTitle}>{xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
          </View>
          <View style={styles.xpRow}>
            <Text style={styles.xpSub}>{xpToNext - xp} XP to Level {level + 1}</Text>
            <Text style={styles.xpSub}>🏆 Top 12%</Text>
          </View>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Text style={{ fontSize: 30 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakDays}>{streak} Day Streak!</Text>
            <Text style={styles.streakSub}>You're on a roll — don't break it</Text>
          </View>
          <Text style={styles.streakLock}>🔒</Text>
        </View>

        {/* Badges */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <TouchableOpacity><Text style={styles.seeAll}>View all</Text></TouchableOpacity>
        </View>
        <View style={styles.badgeGrid}>
          {badges.map(badge => (
            <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}>
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
              {!badge.unlocked && (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedText}>🔒 Locked</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Challenges */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Challenges</Text>
        </View>
        {challenges.map(ch => {
          const pct = (ch.progress / ch.total) * 100;
          return (
            <View key={ch.id} style={styles.challengeCard}>
              <View style={styles.chHeader}>
                <Text style={styles.chTitle}>{ch.label}</Text>
                <Text style={styles.chReward}>+{ch.reward} pts</Text>
              </View>
              <Text style={styles.chDesc}>{ch.desc}</Text>
              <View style={styles.chTrack}>
                <View style={[styles.chFill, { width: `${pct}%` }]} />
              </View>
              <View style={styles.chFooter}>
                <Text style={styles.chProgress}>{ch.progress} of {ch.total} done</Text>
                <Text style={styles.chLeft}>{ch.total - ch.progress} remaining</Text>
              </View>
            </View>
          );
        })}

        {/* Leaderboard Teaser */}
        <View style={styles.leaderCard}>
          <Text style={styles.leaderEmoji}>🥇</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.leaderTitle}>You're in the Top 12%</Text>
            <Text style={styles.leaderSub}>Beat 3 more friends to reach Top 10%</Text>
          </View>
          <TouchableOpacity style={styles.leaderBtn}>
            <Text style={styles.leaderBtnTxt}>View</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SIZES.padding,
    paddingTop: 12, paddingBottom: 8,
  },
  greeting: { fontSize: SIZES.sm, color: COLORS.gray },
  name: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.black, letterSpacing: -0.3 },
  ptsBadge: { backgroundColor: COLORS.orangeLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  ptsTxt: { fontSize: 12, fontWeight: '700', color: COLORS.orange },
  xpCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.orange, borderRadius: SIZES.radiusLg, padding: 20,
  },
  xpLevel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 },
  xpTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 12, letterSpacing: -0.5 },
  xpTrack: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', borderRadius: 6, backgroundColor: COLORS.white },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  streakCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.black, borderRadius: SIZES.radius,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  streakDays: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  streakSub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  streakLock: { fontSize: 20 },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, marginBottom: 10, marginTop: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  seeAll: { fontSize: 12, fontWeight: '500', color: COLORS.orange },
  badgeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: SIZES.padding, gap: 10, marginBottom: 8,
  },
  badgeCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 14, alignItems: 'center', ...SHADOWS.card,
  },
  badgeLocked: { opacity: 0.5 },
  badgeEmoji: { fontSize: 28, marginBottom: 6 },
  badgeName: { fontSize: 12, fontWeight: '700', color: COLORS.black, marginBottom: 2, textAlign: 'center' },
  badgeDesc: { fontSize: 10, color: COLORS.gray, textAlign: 'center' },
  lockedBadge: { marginTop: 6, backgroundColor: COLORS.grayLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  lockedText: { fontSize: 9, color: COLORS.gray },
  challengeCard: {
    marginHorizontal: SIZES.padding, marginBottom: 10,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 14, ...SHADOWS.card,
  },
  chHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chTitle: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  chReward: { fontSize: 12, fontWeight: '600', color: COLORS.orange },
  chDesc: { fontSize: 11, color: COLORS.gray, marginBottom: 8 },
  chTrack: { backgroundColor: COLORS.grayLight, borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 6 },
  chFill: { height: '100%', borderRadius: 6, backgroundColor: COLORS.orange },
  chFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  chProgress: { fontSize: 11, color: COLORS.black, fontWeight: '600' },
  chLeft: { fontSize: 11, color: COLORS.gray },
  leaderCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.black, borderRadius: SIZES.radius,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  leaderEmoji: { fontSize: 26 },
  leaderTitle: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  leaderSub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  leaderBtn: { backgroundColor: COLORS.orange, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  leaderBtnTxt: { fontSize: 12, fontWeight: '700', color: COLORS.white },
});
