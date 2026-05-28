import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const WEEK_DAYS = ['T', 'W', 'Th', 'F', 'Sa', 'Su', 'M'];

export default function StreakBanner({ streak }) {
  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <Text style={styles.flame}>🔥</Text>
        <View>
          <Text style={styles.days}>{streak} day streak!</Text>
          <Text style={styles.sub}>Meet your screen time goal every day</Text>
        </View>
      </View>
      <View style={styles.dots}>
        {WEEK_DAYS.map((d, i) => (
          <View key={i} style={[styles.dot, i < 6 ? styles.done : styles.today]}>
            <Text style={[styles.dotTxt, i < 6 ? styles.doneTxt : styles.todayTxt]}>{d}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.black, borderRadius: SIZES.radius,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  flame: { fontSize: 26 },
  days: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  sub: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  done: { backgroundColor: COLORS.orange },
  today: { backgroundColor: COLORS.white },
  dotTxt: { fontSize: 8, fontWeight: '700' },
  doneTxt: { color: COLORS.white },
  todayTxt: { color: COLORS.black },
});
