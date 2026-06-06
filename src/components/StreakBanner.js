import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreakBanner({ streak }) {
  // We'll use the current day of the week to highlight 'today'
  const todayIdx = new Date().getDay();

  return (
    <View style={styles.banner}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Text style={styles.flame}>🔥</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.days}>{streak} Day Streak!</Text>
          <Text style={styles.sub}>Meet your screen time goal every day</Text>
        </View>
      </View>
      
      <View style={styles.dotsWrap}>
        {WEEK_DAYS.map((d, i) => {
          // Mock logic: days before today are done, today is active
          const isDone = i < todayIdx;
          const isToday = i === todayIdx;
          
          return (
            <View key={i} style={styles.dayCol}>
              <View style={[
                styles.dot, 
                isDone && styles.done, 
                isToday && styles.today, 
                (!isDone && !isToday) && styles.upcoming
              ]}>
                {isDone ? (
                  <Ionicons name="checkmark-sharp" size={16} color={COLORS.white} />
                ) : (
                  <Text style={[
                    styles.dotTxt, 
                    isToday ? styles.todayTxt : styles.upcomingTxt
                  ]}>
                    {d}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: SIZES.padding, marginBottom: 16,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 20, ...SHADOWS.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconWrap: {
    backgroundColor: COLORS.orangeLight,
    width: 48, height: 48,
    borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  flame: { fontSize: 24 },
  textWrap: { flex: 1 },
  days: { fontSize: 18, fontWeight: '800', color: COLORS.black, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  dotsWrap: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  dayCol: { alignItems: 'center' },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  done: { backgroundColor: COLORS.orange },
  today: { backgroundColor: COLORS.black },
  upcoming: { backgroundColor: COLORS.grayLight },
  dotTxt: { fontSize: 13, fontWeight: '700' },
  todayTxt: { color: COLORS.white },
  upcomingTxt: { color: COLORS.gray },
});
