import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useTimer } from '../context/TimerContext';
import { useApp } from '../context/AppContext';
import { SESSION_TYPES } from '../constants/data';
import ExpoAppBlockerModule from '../../modules/expo-app-blocker/src/ExpoAppBlockerModule';

// Generate a 4-digit emergency unlock code
function generateUnlockCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function FocusScreen() {
  const {
    sessionType, displayTime, isRunning, isBreak, progress,
    sessionsCompleted, startTimer, pauseTimer, resetTimer, changeSession,
    sessionHistory, customDuration, setCustomTimerDuration,
  } = useTimer();
  const { apps, blockingEnabled, dispatch } = useApp();

  const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [tempCustomMin, setTempCustomMin] = useState(String(customDuration));

  const RADIUS = 74;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDash = CIRCUMFERENCE * (1 - progress);

  // Sync focusActive state with timer running state
  useEffect(() => {
    if (!isRunning) {
      dispatch({ type: 'SET_FOCUS_ACTIVE', payload: false });
    }
  }, [isRunning]);

  const blockedApps = useMemo(() => apps.filter(a => a.blocked), [apps]);

  const handleStartTimer = useCallback(() => {
    // Always set focus active when starting (fix: was inside permissions check only)
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
      }
    }

    // Set focus active regardless of blocking enabled state
    if (!isBreak) {
      dispatch({ type: 'SET_FOCUS_ACTIVE', payload: true });
    }
    startTimer();
  }, [blockingEnabled, isBreak, dispatch, startTimer]);

  const handlePauseTimer = useCallback(() => {
    dispatch({ type: 'SET_FOCUS_ACTIVE', payload: false });
    pauseTimer();
  }, [dispatch, pauseTimer]);

  const handleResetTimer = useCallback(() => {
    dispatch({ type: 'SET_FOCUS_ACTIVE', payload: false });
    resetTimer();
  }, [dispatch, resetTimer]);

  const handleEmergencyUnlock = useCallback(() => {
    const code = generateUnlockCode();
    setExpectedCode(code);
    setUnlockCode('');
    setShowEmergencyUnlock(true);
  }, []);

  const confirmEmergencyUnlock = useCallback(() => {
    if (unlockCode === expectedCode) {
      dispatch({ type: 'SET_FOCUS_ACTIVE', payload: false });
      // Deduct points as penalty
      dispatch({ type: 'ADD_POINTS', payload: -10 });
      pauseTimer();
      setShowEmergencyUnlock(false);
      Alert.alert('Unlocked', 'Emergency unlock activated. 10 points deducted as penalty.');
    } else {
      Alert.alert('Wrong code', 'Please enter the correct code to unlock.');
    }
  }, [unlockCode, expectedCode, dispatch, pauseTimer]);

  const handleCustomDurationSave = useCallback(() => {
    const mins = parseInt(tempCustomMin, 10);
    if (isNaN(mins) || mins < 5 || mins > 120) {
      Alert.alert('Invalid', 'Duration must be between 5 and 120 minutes.');
      return;
    }
    setCustomTimerDuration(mins);
    setShowCustomDuration(false);
  }, [tempCustomMin, setCustomTimerDuration]);

  const handleSessionChange = useCallback((s) => {
    changeSession(s);
    if (s.id === 'custom') {
      setShowCustomDuration(true);
      setTempCustomMin(String(customDuration));
    } else {
      setShowCustomDuration(false);
    }
  }, [changeSession, customDuration]);

  // Format session history time
  function formatSessionTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

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
              onPress={() => handleSessionChange(s)}
            >
              <Text style={styles.sessionPillEmoji}>{s.emoji}</Text>
              <Text style={[styles.sessionPillText, sessionType.id === s.id && { color: COLORS.white }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Custom Duration Picker */}
        {showCustomDuration && sessionType.id === 'custom' && (
          <View style={styles.customCard}>
            <Text style={styles.customLabel}>Custom duration (minutes)</Text>
            <View style={styles.customRow}>
              {[5, 10, 15, 20, 30, 45, 60, 90].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.customChip, customDuration === m && styles.customChipActive]}
                  onPress={() => {
                    setTempCustomMin(String(m));
                    setCustomTimerDuration(m);
                  }}
                >
                  <Text style={[styles.customChipTxt, customDuration === m && styles.customChipTxtActive]}>
                    {m}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                value={tempCustomMin}
                onChangeText={setTempCustomMin}
                keyboardType="number-pad"
                placeholder="25"
                placeholderTextColor={COLORS.gray}
                maxLength={3}
              />
              <TouchableOpacity style={styles.customSaveBtn} onPress={handleCustomDurationSave}>
                <Text style={styles.customSaveTxt}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>
            {isBreak ? '☕ BREAK TIME' : sessionType.id === 'custom' ? `⚙️ CUSTOM · ${customDuration}M` : 'POMODORO TIMER'}
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

        {/* Emergency Unlock (shown during active focus) */}
        {isRunning && !isBreak && blockingEnabled && (
          <TouchableOpacity
            style={styles.emergencyBtn}
            onPress={handleEmergencyUnlock}
          >
            <Text style={styles.emergencyTxt}>🔓 Emergency unlock (−10 pts)</Text>
          </TouchableOpacity>
        )}

        {/* Emergency Unlock Modal */}
        {showEmergencyUnlock && (
          <View style={styles.emergencyCard}>
            <Text style={styles.emergencyTitle}>Emergency Unlock</Text>
            <Text style={styles.emergencyDesc}>
              Type this code to unlock: <Text style={styles.emergencyCode}>{expectedCode}</Text>
            </Text>
            <TextInput
              style={styles.emergencyInput}
              value={unlockCode}
              onChangeText={setUnlockCode}
              keyboardType="number-pad"
              placeholder="Enter code"
              placeholderTextColor={COLORS.gray}
              maxLength={4}
            />
            <View style={styles.emergencyBtnRow}>
              <TouchableOpacity
                style={styles.emergencyCancelBtn}
                onPress={() => setShowEmergencyUnlock(false)}
              >
                <Text style={styles.emergencyCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emergencyConfirmBtn} onPress={confirmEmergencyUnlock}>
                <Text style={styles.emergencyConfirmTxt}>Unlock</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
            {blockedApps.map(app => (
              <View key={app.id} style={[styles.pill, blockingEnabled && styles.pillActive]}>
                <Text style={styles.pillText}>{app.name}</Text>
              </View>
            ))}
            {blockedApps.length === 0 && (
              <Text style={styles.noPillText}>No apps blocked. Manage in Settings → App blocking.</Text>
            )}
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

        {/* Today's Session History */}
        {sessionHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's sessions</Text>
            {sessionHistory.slice(-5).reverse().map((session, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={styles.historyBody}>
                  <Text style={styles.historyLabel}>{session.label || session.type}</Text>
                  <Text style={styles.historySub}>
                    {session.duration}min · +{session.points} pts
                  </Text>
                </View>
                <Text style={styles.historyTime}>
                  {session.completedAt ? formatSessionTime(session.completedAt) : ''}
                </Text>
              </View>
            ))}
            {sessionHistory.length > 5 && (
              <Text style={styles.historyMore}>
                +{sessionHistory.length - 5} more session{sessionHistory.length - 5 !== 1 ? 's' : ''} today
              </Text>
            )}
          </View>
        )}

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
  customCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 14, ...SHADOWS.card,
  },
  customLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray, marginBottom: 8 },
  customRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  customChip: {
    backgroundColor: COLORS.grayLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  customChipActive: { backgroundColor: COLORS.orange },
  customChipTxt: { fontSize: 12, fontWeight: '600', color: COLORS.black },
  customChipTxtActive: { color: COLORS.white },
  customInputRow: { flexDirection: 'row', gap: 8 },
  customInput: {
    flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: COLORS.black,
  },
  customSaveBtn: {
    backgroundColor: COLORS.orange, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  customSaveTxt: { fontSize: 13, fontWeight: '700', color: COLORS.white },
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
  emergencyBtn: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: '#FEE2E2', borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  emergencyTxt: { fontSize: 12, fontWeight: '600', color: COLORS.red },
  emergencyCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 16, borderWidth: 1.5, borderColor: COLORS.red, ...SHADOWS.card,
  },
  emergencyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.red, marginBottom: 6 },
  emergencyDesc: { fontSize: 13, color: COLORS.gray, marginBottom: 12, lineHeight: 20 },
  emergencyCode: { fontSize: 18, fontWeight: '800', color: COLORS.black, letterSpacing: 2 },
  emergencyInput: {
    backgroundColor: COLORS.grayLight, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 18, color: COLORS.black, textAlign: 'center',
    letterSpacing: 4, fontWeight: '700', marginBottom: 12,
  },
  emergencyBtnRow: { flexDirection: 'row', gap: 10 },
  emergencyCancelBtn: {
    flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 12,
    paddingVertical: 11, alignItems: 'center',
  },
  emergencyCancelTxt: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  emergencyConfirmBtn: {
    flex: 1, backgroundColor: COLORS.red, borderRadius: 12,
    paddingVertical: 11, alignItems: 'center',
  },
  emergencyConfirmTxt: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  card: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 14, ...SHADOWS.card,
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
  noPillText: { fontSize: 11, color: COLORS.gray, fontStyle: 'italic' },
  rewardPts: { fontSize: 22, fontWeight: '800', color: COLORS.orange, marginTop: 4 },
  rewardBonus: { fontSize: 11, color: COLORS.gray, marginTop: 3 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.grayLight,
  },
  historyDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orange,
  },
  historyBody: { flex: 1 },
  historyLabel: { fontSize: 12, fontWeight: '600', color: COLORS.black },
  historySub: { fontSize: 10, color: COLORS.gray, marginTop: 1 },
  historyTime: { fontSize: 11, color: COLORS.gray },
  historyMore: { fontSize: 11, color: COLORS.orange, fontWeight: '600', marginTop: 8, textAlign: 'center' },
});
