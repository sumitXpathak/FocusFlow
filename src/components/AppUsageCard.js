import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function AppUsageCard({ app }) {
  const { dispatch } = useApp();
  const pct = Math.min((app.used / app.limit) * 100, 100);
  const isOver = app.used > app.limit;
  const isWarn = pct >= 80 && !isOver;
  const barColor = isOver ? COLORS.red : isWarn ? COLORS.orange : COLORS.green;

  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: app.color || '#E8F0FE' }]}>
        <Text style={styles.iconEmoji}>
          {app.icon || app.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.appName}>{app.name}</Text>
          {app.blocked && (
            <View style={styles.blockedPill}>
              <Text style={styles.blockedTxt}>blocked</Text>
            </View>
          )}
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, isOver && { color: COLORS.red }]}>{app.used}m</Text>
        <Text style={styles.limit}>limit {app.limit}m</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SIZES.padding, marginBottom: 8,
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 12, flexDirection: 'row',
    alignItems: 'center', gap: 12, ...SHADOWS.card,
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 21 },
  body: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  appName: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  blockedPill: {
    backgroundColor: COLORS.orangeLight, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  blockedTxt: { fontSize: 9, fontWeight: '700', color: COLORS.orange, textTransform: 'uppercase' },
  barTrack: { backgroundColor: COLORS.grayLight, borderRadius: 4, height: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  right: { alignItems: 'flex-end' },
  time: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  limit: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
});
