import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { BADGES, CHALLENGES } from '../constants/data';
import * as Progress from 'react-native-progress';

export default function RewardsScreen({ navigation }) {
  const {
    points, level, xpProgress, xpToNext,
    unlockedBadges, challengeProgress, quests,
    productivityScore, focusSessionsToday, screenTimeToday,
    dailyGoalHours
  } = useApp();

  const [showBadgesModal, setShowBadgesModal] = useState(false);
  
  // Format score based on values
  const isExcellent = productivityScore >= 80;
  const isGood = productivityScore >= 50 && productivityScore < 80;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Your progress</Text>
            <Text style={styles.title}>Rewards & Stats</Text>
          </View>
          <TouchableOpacity style={styles.leaderboardBtn} onPress={() => navigation?.navigate('Leaderboard')}>
            <Ionicons name="trophy-outline" size={18} color={COLORS.orange} />
            <Text style={styles.leaderboardBtnTxt}>Leaderboard</Text>
          </TouchableOpacity>
        </View>

        {/* Level & Points Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelCircle}>
              <Text style={styles.levelNum}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Level {level}</Text>
              <Text style={styles.xpText}>{Math.floor(xpProgress)} / {xpToNext} XP</Text>
            </View>
            <View style={styles.ptsBadge}>
              <Text style={styles.ptsTxt}>{points.toLocaleString()} pts</Text>
            </View>
          </View>
          <Progress.Bar
            progress={Math.min(xpProgress / xpToNext, 1)}
            width={null}
            height={8}
            color={COLORS.orange}
            unfilledColor="rgba(255,255,255,0.2)"
            borderWidth={0}
            style={{ marginTop: 16 }}
          />
        </View>

        {/* Productivity Score */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productivity Score</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreCircle, isExcellent ? styles.scoreExc : isGood ? styles.scoreGood : styles.scoreFair]}>
              <Text style={[styles.scoreTxt, isExcellent ? styles.scoreTxtExc : isGood ? styles.scoreTxtGood : styles.scoreTxtFair]}>
                {productivityScore}
              </Text>
            </View>
            <View style={styles.scoreBody}>
              <Text style={styles.scoreLabel}>
                {isExcellent ? 'Excellent focus today!' : isGood ? 'Good progress' : 'Needs improvement'}
              </Text>
              <Text style={styles.scoreDesc}>
                Based on focus sessions, screen time, and current streak.
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Quests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Quests</Text>
        </View>
        <View style={styles.card}>
          {quests.map(quest => (
            <View key={quest.id} style={styles.questRow}>
              <View style={[styles.questCheck, quest.completed && styles.questCheckActive]}>
                {quest.completed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
              </View>
              <View style={styles.questBody}>
                <Text style={[styles.questLabel, quest.completed && styles.questLabelDone]}>
                  {quest.label}
                </Text>
                <Progress.Bar
                  progress={quest.completed ? 1 : Math.min(quest.current / quest.target, 1)}
                  width={150}
                  height={6}
                  color={COLORS.orange}
                  unfilledColor={COLORS.grayLight}
                  borderWidth={0}
                  style={{ marginTop: 6 }}
                />
              </View>
              <Text style={styles.questReward}>+{quest.reward} pts</Text>
            </View>
          ))}
          {quests.length === 0 && (
            <Text style={{ fontSize: 13, color: COLORS.gray, padding: 10 }}>No active quests</Text>
          )}
        </View>

        {/* Active Challenges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
        </View>
        <View style={{ paddingHorizontal: SIZES.padding }}>
          {CHALLENGES.map(c => {
            const currentProg = challengeProgress[c.id] || 0;
            const completed = currentProg >= c.total;
            return (
              <View key={c.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeLabel}>{c.label}</Text>
                  <Text style={styles.challengeReward}>+{c.reward} pts</Text>
                </View>
                <Text style={styles.challengeDesc}>{c.desc}</Text>
                <View style={styles.challengeProgRow}>
                  <View style={styles.challengeBarWrap}>
                    <Progress.Bar
                      progress={Math.min(currentProg / c.total, 1)}
                      width={null}
                      height={8}
                      color={COLORS.orange}
                      unfilledColor={COLORS.grayLight}
                      borderWidth={0}
                    />
                  </View>
                  <Text style={styles.challengeProgTxt}>{currentProg}/{c.total}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Badges</Text>
          <TouchableOpacity onPress={() => setShowBadgesModal(true)}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.badgeRow}>
          {BADGES.slice(0, 4).map(badge => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            return (
              <View key={badge.id} style={[styles.badgeItem, !isUnlocked && styles.badgeItemLocked]}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeName} numberOfLines={1}>{badge.name}</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Badges Modal */}
      <Modal visible={showBadgesModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Badges</Text>
              <TouchableOpacity onPress={() => setShowBadgesModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.badgesGrid}>
                {BADGES.map(badge => {
                  const isUnlocked = unlockedBadges.includes(badge.id);
                  return (
                    <View key={badge.id} style={[styles.badgeGridItem, !isUnlocked && styles.badgeItemLocked]}>
                      <Text style={styles.badgeEmojiBig}>{badge.emoji}</Text>
                      <Text style={styles.badgeNameBig} numberOfLines={1}>{badge.name}</Text>
                      <Text style={styles.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
                      {!isUnlocked && <Text style={styles.lockedTxt}>Locked</Text>}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingTop: 12, paddingBottom: 16,
  },
  greeting: { fontSize: SIZES.sm, color: COLORS.gray },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.black, letterSpacing: -0.3 },
  leaderboardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, ...SHADOWS.card,
  },
  leaderboardBtnTxt: { fontSize: 13, fontWeight: '600', color: COLORS.orange },
  levelCard: {
    marginHorizontal: SIZES.padding, marginBottom: 20,
    backgroundColor: COLORS.black, borderRadius: SIZES.radiusLg,
    padding: 20, ...SHADOWS.card,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
  },
  levelNum: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  xpText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  ptsBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  ptsTxt: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, marginBottom: 12, marginTop: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  seeAll: { fontSize: 13, fontWeight: '600', color: COLORS.orange },
  card: {
    marginHorizontal: SIZES.padding, marginBottom: 16,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 16, ...SHADOWS.card,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', borderWidth: 4,
  },
  scoreExc: { borderColor: COLORS.green, backgroundColor: COLORS.greenLight },
  scoreGood: { borderColor: COLORS.orange, backgroundColor: COLORS.orangeLight },
  scoreFair: { borderColor: COLORS.red, backgroundColor: '#FEE2E2' },
  scoreTxt: { fontSize: 20, fontWeight: '800' },
  scoreTxtExc: { color: COLORS.green },
  scoreTxtGood: { color: COLORS.orange },
  scoreTxtFair: { color: COLORS.red },
  scoreBody: { flex: 1 },
  scoreLabel: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  scoreDesc: { fontSize: 12, color: COLORS.gray, marginTop: 4, lineHeight: 16 },
  questRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.grayLight,
  },
  questCheck: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  questCheckActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  questBody: { flex: 1 },
  questLabel: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  questLabelDone: { textDecorationLine: 'line-through', color: COLORS.gray },
  questReward: { fontSize: 13, fontWeight: '700', color: COLORS.orange },
  challengeCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 16, marginBottom: 12, ...SHADOWS.card,
  },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  challengeLabel: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  challengeReward: { fontSize: 13, fontWeight: '700', color: COLORS.orange },
  challengeDesc: { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  challengeProgRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  challengeBarWrap: { flex: 1 },
  challengeProgTxt: { fontSize: 12, fontWeight: '600', color: COLORS.gray, width: 30, textAlign: 'right' },
  badgeRow: { flexDirection: 'row', paddingHorizontal: SIZES.padding, gap: 10, marginBottom: 12 },
  badgeItem: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 12, alignItems: 'center', ...SHADOWS.card,
  },
  badgeItemLocked: { opacity: 0.5 },
  badgeEmoji: { fontSize: 24, marginBottom: 6 },
  badgeName: { fontSize: 10, fontWeight: '600', color: COLORS.black, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  closeBtn: { padding: 4 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  badgeGridItem: {
    width: '48%', backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 16, alignItems: 'center', marginBottom: 12, ...SHADOWS.card,
  },
  badgeEmojiBig: { fontSize: 36, marginBottom: 8 },
  badgeNameBig: { fontSize: 14, fontWeight: '700', color: COLORS.black, marginBottom: 4, textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: COLORS.gray, textAlign: 'center' },
  lockedTxt: { fontSize: 10, fontWeight: '700', color: COLORS.red, marginTop: 8, textTransform: 'uppercase' },
});
