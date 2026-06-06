import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useTimer } from '../context/TimerContext';
import { useApp } from '../context/AppContext';
import { SESSION_TYPES } from '../constants/data';
import ExpoAppBlockerModule from '../../modules/expo-app-blocker/src/ExpoAppBlockerModule';

export default function FocusScreen() {
  const { sessionType, displayTime, isRunning, isBreak, progress,
          sessionsCompleted, startTimer, pauseTimer, resetTimer, changeSession } = useTimer();
  const { apps, blockingEnabled, dispatch } = useApp();

  const RADIUS = 74;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDash = CIRCUMFERENCE * (1 - progress);

  // Stop blocking when unmounting or timer ends
  useEffect(() => {
    if (!isRunning) {
      if (ExpoAppBlockerModule?.stopBlocking) ExpoAppBlockerModule.stopBlocking();
    }
  }, [isRunning]);

  const handleStartTimer = () => {
    if (blockingEnabled && !isBreak) {
      // Check native permissions before starting
      if (ExpoAppBlockerModule?.hasUsagePermission && ExpoAppBlockerModule?.hasOverlayPermission) {
        if (!ExpoAppBlockerModule.hasUsagePermission()) {
          Alert.alert("Permission Required", "Usage Access is required to know which app you are opening. Please enable it in Settings.", [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => ExpoAppBlockerModule.requestUsagePermission() }
          ]);
          return;
        }
        if (!ExpoAppBlockerModule.hasOverlayPermission()) {
          Alert.alert("Permission Required", "Display Over Other Apps permission is required to draw the block screen. Please enable it in Settings.", [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => ExpoAppBlockerModule.requestOverlayPermission() }
          ]);
          return;
        }

        // Start native blocking
        const blockedPackages = apps.filter(a => a.blocked).map(a => a.id);
        ExpoAppBlockerModule.startBlocking(blockedPackages);
      }
    }
    startTimer();
  };

  const handlePauseTimer = () => {
    if (ExpoAppBlockerModule?.stopBlocking) ExpoAppBlockerModule.stopBlocking();
    pauseTimer();
  };

  const handleResetTimer = () => {
    if (ExpoAppBlockerModule?.stopBlocking) ExpoAppBlockerModule.stopBlocking();
    resetTimer();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Stay in the zone</Text>
            <Text style={styles.name}>Focus Mode</Text>
          </View>
          <View style={styles.ptsBadge}>
            <Text style={styles.ptsTxt}>+{sessionType.points} pts/session</Text>
          </View>
        </View>

        {/* Session Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.sessionScroll} contentContainerStyle={{ paddingHorizontal: SIZES.padding, gap: 8 }}>
          {SESSION_TYPES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.sessionPill, sessionType.id === s.id && styles.sessionPillActive]}
              onPress={() => changeSession(s)}
            >
              <Text style={styles.sessionPillEmoji}>{s.emoji}</Text>
              <Text style={[styles.sessionPillText, sessionType.id === s.id && { color: COLORS.white }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>
            {isBreak ? '☕ BREAK TIME' : 'POMODORO TIMER'}
          </Text>

          <View style={styles.ringWrap}>
            <Svg width={170} height={170} viewBox="0 0 170 170">
              <Circle cx={85} cy={85} r={RADIUS} fill="none" stroke="#2A2A2A" strokeWidth={12} />
              <Circle
                cx={85} cy={85} r={RADIUS} fill="none"
                stroke={isBreak ? COLORS.green : COLORS.orange}
                strokeWidth={12}
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDash}
                strokeLinecap="round"
                rotation={-90} origin="85, 85"
              />
            </Svg>
            <View style={styles.timerCenter}>
              <Text style={styles.timerBig}>{displayTime}</Text>
              <Text style={styles.timerSub}>remaining</Text>
            </View>
          </View>

          <Text style={styles.sessionLabel}>
            {isBreak ? 'Short Break ☕' : `${sessionType.emoji} ${sessionType.label}`}
          </Text>
          <Text style={styles.sessionsDone}>
            {sessionsCompleted} session{sessionsCompleted !== 1 ? 's' : ''} completed today
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.btnOrange}
            onPress={isRunning ? handlePauseTimer : handleStartTimer}
          >
            <Text style={styles.btnOrangeTxt}>
              {isRunning ? '⏸  Pause' : '▶  Start'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDark} onPress={handleResetTimer}>
            <Text style={styles.btnDarkTxt}>↩  Reset</Text>
          </TouchableOpacity>
        </View>

        {/* App Blocking */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>App blocking</Text>
            <TouchableOpacity
              style={[styles.toggle, blockingEnabled && styles.toggleOn]}
              onPress={() => dispatch({ type: 'TOGGLE_BLOCKING' })}
            >
              <View style={[styles.knob, blockingEnabled && styles.knobOn]} />
            </TouchableOpacity>
          </View>
          <View style={styles.pillWrap}>
            {apps.filter(a => a.blocked).map(app => (
              <View key={app.id} style={[styles.pill, blockingEnabled && styles.pillActive]}>
                <Text style={styles.pillText}>{app.icon} {app.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reward Preview */}
        <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View>
            <Text style={styles.cardTitle}>Session reward</Text>
            <Text style={styles.rewardPts}>+{sessionType.points} pts</Text>
            <Text style={styles.rewardBonus}>+5 bonus if no blocks broken</Text>
          </View>
          <Text style={{ fontSize: 36 }}>🏆</Text>
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
  ptsBadge: {
    backgroundColor: COLORS.orangeLight, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  ptsTxt: { fontSize: 12, fontWeight: '600', color: COLORS.orange },
  sessionScroll: { marginBottom: 12 },
  sessionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.white, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  sessionPillActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  sessionPillEmoji: { fontSize: 14 },
  sessionPillText: { fontSize: 12, fontWeight: '600', color: COLORS.black },
  timerCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.black, borderRadius: SIZES.radiusLg,
    padding: 24, alignItems: 'center',
  },
  timerLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.gray,
    letterSpacing: 1.5, marginBottom: 16,
  },
  ringWrap: { width: 170, height: 170, position: 'relative', marginBottom: 16 },
  timerCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  timerBig: { fontSize: 38, fontWeight: '800', color: COLORS.white, letterSpacing: -1 },
  timerSub: { fontSize: 10, color: COLORS.gray, letterSpacing: 1, textTransform: 'uppercase' },
  sessionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.orange },
  sessionsDone: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  btnRow: {
    flexDirection: 'row', marginHorizontal: SIZES.padding,
    gap: 10, marginBottom: 12,
  },
  btnOrange: {
    flex: 1, backgroundColor: COLORS.orange, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  btnOrangeTxt: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  btnDark: {
    flex: 1, backgroundColor: COLORS.black, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  btnDarkTxt: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  card: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.black },
  toggle: {
    width: 44, height: 24, backgroundColor: '#E5E7EB',
    borderRadius: 12, position: 'relative',
  },
  toggleOn: { backgroundColor: COLORS.orange },
  knob: {
    position: 'absolute', top: 3, left: 3,
    width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.white,
  },
  knobOn: { left: 23 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: {
    backgroundColor: COLORS.grayLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pillActive: { backgroundColor: COLORS.orangeLight },
  pillText: { fontSize: 11, fontWeight: '500', color: COLORS.orange },
  rewardPts: { fontSize: 22, fontWeight: '800', color: COLORS.orange, marginTop: 4 },
  rewardBonus: { fontSize: 11, color: COLORS.gray, marginTop: 3 },
});
