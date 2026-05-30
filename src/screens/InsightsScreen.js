import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getWeeklyStats } from '../services/firestoreService';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - SIZES.padding * 2 - 32 - 48) / 7;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function InsightsScreen() {
  const { weeklyData, categoryData, screenTimeToday, dailyGoalHours } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState('week');
  const [weekStats, setWeekStats] = useState(null);

  const GOAL_MINS = dailyGoalHours * 60;

  // Load detailed weekly stats from Firestore
  useEffect(() => {
    if (isAuthenticated && user) {
      getWeeklyStats(user.uid)
        .then(stats => setWeekStats(stats))
        .catch(e => console.log('Weekly stats error:', e.message));
    }
  }, [isAuthenticated, user]);

  // Use Firestore weekly data if available, otherwise fall back to context
  const displayData = weekStats
    ? weekStats.map(s => s.screenTimeMinutes || 0)
    : weeklyData;

  const maxVal = Math.max(...displayData, 1);

  const avgDaily = Math.round(displayData.reduce((a, b) => a + b, 0) / 7);
  const avgHrs = Math.floor(avgDaily / 60);
  const avgMins = avgDaily % 60;
  const goalsMet = displayData.filter(d => d <= GOAL_MINS).length;

  // Category data from context (synced from Firestore)
  const totalCat = Object.values(categoryData).reduce((a, b) => a + b, 0) || 1;
  const CATEGORIES = [
    { label: 'Social',         pct: Math.round((categoryData.Social || 0) / totalCat * 100) || 0, color: COLORS.orange },
    { label: 'Entertainment',  pct: Math.round((categoryData.Entertainment || 0) / totalCat * 100) || 0, color: COLORS.black  },
    { label: 'Productivity',   pct: Math.round((categoryData.Productivity || 0) / totalCat * 100) || 0, color: COLORS.green  },
    { label: 'Other',          pct: Math.round((categoryData.Other || 0) / totalCat * 100) || 0, color: COLORS.grayLight },
  ];

  // Handle case where all categories are 0 — show placeholder
  const hasCategoryData = totalCat > 1;

  // Donut chart segments
  const RADIUS = 35;
  const CIRC = 2 * Math.PI * RADIUS;
  let offset = 0;
  const segments = CATEGORIES.map(cat => {
    const pct = hasCategoryData ? cat.pct : 25; // equal segments if no data
    const len = (pct / 100) * CIRC;
    const seg = { ...cat, pct, len, offset };
    offset += len;
    return seg;
  });

  // Compute week-over-week change
  const thisWeekTotal = displayData.reduce((a, b) => a + b, 0);
  const weekChangeText = thisWeekTotal === 0
    ? 'No data yet'
    : `${avgHrs}h ${avgMins}m avg daily`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Your patterns</Text>
            <Text style={styles.name}>Insights</Text>
          </View>
          <View style={styles.tabRow}>
            {['week', 'month'].map(t => (
              <TouchableOpacity
                key={t} onPress={() => setTab(t)}
                style={[styles.tabPill, tab === t && styles.tabPillActive]}
              >
                <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                  {t === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.card]}>
            <Text style={styles.statLabel}>Avg daily</Text>
            <Text style={styles.statVal}>
              {thisWeekTotal === 0 ? '—' : `${avgHrs}h ${avgMins}m`}
            </Text>
            <Text style={styles.statSub}>{weekChangeText}</Text>
          </View>
          <View style={[styles.statCard, styles.cardOrange]}>
            <Text style={[styles.statLabel, { color: COLORS.white, opacity: 0.8 }]}>Goals met</Text>
            <Text style={[styles.statVal, { color: COLORS.white }]}>{goalsMet} / 7</Text>
            <Text style={[styles.statSub, { color: 'rgba(255,255,255,0.75)' }]}>days this week</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={[styles.chartCard, styles.card]}>
          <Text style={styles.chartTitle}>Daily screen time (hrs)</Text>
          <View style={styles.barChart}>
            {displayData.map((val, i) => {
              const isToday = i === 6;
              const isOver = val > GOAL_MINS;
              const barH = Math.max((val / maxVal) * 80, 4);
              const color = isToday ? COLORS.orange : isOver ? COLORS.red : COLORS.green;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barVal}>
                    {val === 0 ? '—' : `${Math.floor(val / 60)}h${val % 60 > 0 ? `${val % 60}m` : ''}`}
                  </Text>
                  <View style={[styles.barRect, { height: barH, backgroundColor: color }]} />
                  <Text style={[styles.barDay, isToday && { color: COLORS.orange, fontWeight: '700' }]}>
                    {DAYS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            {[
              { color: COLORS.orange, label: 'Today' },
              { color: COLORS.red,    label: 'Over limit' },
              { color: COLORS.green,  label: 'Under limit' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendTxt}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Donut Chart */}
        <View style={[styles.chartCard, styles.card]}>
          <Text style={styles.chartTitle}>Time by category</Text>
          <View style={styles.donutWrap}>
            <View>
              <Svg width="90" height="90" viewBox="0 0 90 90">
                {segments.map((seg, i) => (
                  <Circle
                    key={i} cx={45} cy={45} r={RADIUS}
                    fill="none" stroke={seg.color} strokeWidth={18}
                    strokeDasharray={`${seg.len} ${CIRC}`}
                    strokeDashoffset={-seg.offset}
                    rotation={-90} origin="45, 45"
                  />
                ))}
              </Svg>
            </View>
            <View style={styles.donutLegend}>
              {CATEGORIES.map(cat => (
                <View key={cat.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.legendLabel}>{cat.label}</Text>
                  <Text style={styles.legendPct}>
                    {hasCategoryData ? `${cat.pct}%` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Insight Tips */}
        <View style={[styles.chartCard, styles.card]}>
          <Text style={styles.chartTitle}>💡 This week's insight</Text>
          <Text style={styles.insightText}>
            {thisWeekTotal === 0
              ? 'Start tracking your screen time to unlock personalised insights and tips!'
              : `You spend ${CATEGORIES[0].pct}% of your screen time on social media. Reducing by just 30 min/day could earn you an extra `
            }
            {thisWeekTotal > 0 && (
              <Text style={{ color: COLORS.orange, fontWeight: '700' }}>210 bonus points</Text>
            )}
            {thisWeekTotal > 0 ? ' per week.' : ''}
          </Text>
        </View>

        {/* Weekly Report Button */}
        <TouchableOpacity style={styles.reportBtn} activeOpacity={0.85}>
          <Text style={styles.reportBtnTxt}>Generate weekly report ↗</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SIZES.padding, paddingTop: 12, paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greeting: { fontSize: SIZES.sm, color: COLORS.gray },
  name: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.black, letterSpacing: -0.3 },
  tabRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tabPill: {
    backgroundColor: COLORS.white, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  tabPillActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  tabTxt: { fontSize: 11, fontWeight: '600', color: COLORS.gray },
  tabTxtActive: { color: COLORS.white },
  statsRow: { flexDirection: 'row', marginHorizontal: SIZES.padding, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, padding: 14 },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius, ...SHADOWS.card,
  },
  cardOrange: {
    flex: 1, padding: 14,
    backgroundColor: COLORS.orange, borderRadius: SIZES.radius, ...SHADOWS.card,
  },
  statLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  statSub: { fontSize: 10, color: COLORS.green, marginTop: 2 },
  chartCard: { marginHorizontal: SIZES.padding, marginBottom: 12, padding: 16 },
  chartTitle: { fontSize: 13, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barVal: { fontSize: 8, color: COLORS.gray, marginBottom: 2 },
  barRect: { width: '100%', borderRadius: 4, minHeight: 4 },
  barDay: { fontSize: 9, color: COLORS.gray },
  legend: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendTxt: { fontSize: 10, color: COLORS.gray },
  donutWrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutLegend: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  legendLabel: { fontSize: 11, color: COLORS.black, flex: 1 },
  legendPct: { fontSize: 11, color: COLORS.gray, fontWeight: '500' },
  insightText: { fontSize: 13, color: COLORS.gray, lineHeight: 20 },
  reportBtn: {
    marginHorizontal: SIZES.padding, backgroundColor: COLORS.black,
    borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 12,
  },
  reportBtnTxt: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
