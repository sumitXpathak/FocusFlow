import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

import HeatmapChart from '../components/HeatmapChart';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function InsightsScreen() {
  const { weeklyData, categoryData, focusSessionsToday } = useApp();
  const [tab, setTab] = useState('week');

  const maxVal = Math.max(...weeklyData, 60);

  // Generate fake heatmap data for the month view based on today's sessions
  const monthData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 35; i++) {
      let intensity = Math.floor(Math.random() * 3);
      if (i === 34) {
        // Today
        intensity = Math.min(focusSessionsToday, 4);
      }
      data.push({ day: i + 1, intensity });
    }
    return data;
  }, [focusSessionsToday]);

  const catTotal = Object.values(categoryData).reduce((a, b) => a + b, 0) || 1;
  const categories = Object.keys(categoryData).map(k => ({
    name: k,
    val: categoryData[k],
    pct: Math.round((categoryData[k] / catTotal) * 100)
  })).sort((a, b) => b.val - a.val);

  function handleExport() {
    Alert.alert('Report Generated', 'Your weekly analytics report has been saved to your device.');
  }

  // Determine focus type based on most used category
  const topCategory = categories[0]?.name || 'Productivity';
  let focusType = 'Balanced';
  let focusDesc = 'You maintain a healthy mix of work and play.';
  if (topCategory === 'Productivity' && categories[0].pct > 50) {
    focusType = 'Deep Worker';
    focusDesc = 'You spend the majority of your time on productive tasks. Great job!';
  } else if (topCategory === 'Social' && categories[0].pct > 40) {
    focusType = 'Social Butterfly';
    focusDesc = 'You stay highly connected. Watch out for infinite scrolls!';
  } else if (topCategory === 'Entertainment' && categories[0].pct > 40) {
    focusType = 'Entertainment Seeker';
    focusDesc = 'You consume a lot of media. Consider setting firmer limits.';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Your analytics</Text>
            <Text style={styles.title}>Insights</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color={COLORS.orange} />
            <Text style={styles.exportBtnTxt}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['week', 'month'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                {t === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {tab === 'week' ? 'Screen Time Trend' : 'Focus Consistency'}
          </Text>
          <Text style={styles.cardSub}>
            {tab === 'week' ? 'Daily usage in minutes' : 'Daily focus intensity'}
          </Text>
          
          {tab === 'week' ? (
            <View style={styles.chartWrap}>
              {weeklyData.map((val, i) => {
                const h = Math.max((val / maxVal) * 120, 4);
                const isToday = i === new Date().getDay() - 1; // Simplification
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: h, backgroundColor: isToday ? COLORS.orange : COLORS.orangeLight }]} />
                    </View>
                    <Text style={[styles.barLabel, isToday && { fontWeight: '700', color: COLORS.orange }]}>
                      {DAY_LABELS[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <HeatmapChart data={monthData} monthLabel="Last 30 Days" />
          )}
        </View>

        {/* Your Focus Type */}
        <Text style={styles.sectionTitle}>Your Focus Profile</Text>
        <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
          <View style={styles.focusTypeIcon}>
            <Text style={{ fontSize: 28 }}>
              {focusType === 'Deep Worker' ? '🧠' : focusType === 'Social Butterfly' ? '💬' : focusType === 'Entertainment Seeker' ? '🎮' : '⚖️'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.focusTypeTitle}>{focusType}</Text>
            <Text style={styles.focusTypeDesc}>{focusDesc}</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>App Categories</Text>
        <View style={styles.card}>
          {categories.map((c, i) => (
            <View key={c.name} style={styles.catRow}>
              <View style={styles.catInfo}>
                <View style={styles.catDot} />
                <Text style={styles.catName}>{c.name}</Text>
                <Text style={styles.catVal}>{c.val}m</Text>
              </View>
              <View style={styles.catTrack}>
                <View style={[styles.catFill, { width: `${c.pct}%` }]} />
              </View>
            </View>
          ))}
          {categories.length === 0 && (
            <Text style={styles.emptyTxt}>No category data available.</Text>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, ...SHADOWS.card,
  },
  exportBtnTxt: { fontSize: 13, fontWeight: '600', color: COLORS.orange },
  tabRow: {
    flexDirection: 'row', marginHorizontal: SIZES.padding,
    backgroundColor: COLORS.grayLight, borderRadius: 12, padding: 4,
    marginBottom: 20,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: COLORS.white, ...SHADOWS.small },
  tabTxt: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  tabTxtActive: { color: COLORS.black },
  card: {
    marginHorizontal: SIZES.padding, marginBottom: 20,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 20, ...SHADOWS.card,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  cardSub: { fontSize: 12, color: COLORS.gray, marginTop: 2, marginBottom: 20 },
  chartWrap: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', height: 140, paddingTop: 10,
  },
  barCol: { alignItems: 'center', width: 30 },
  barTrack: {
    width: 28, height: 120, backgroundColor: COLORS.grayLight,
    borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 10, color: COLORS.gray, marginTop: 8 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.black,
    paddingHorizontal: SIZES.padding, marginBottom: 12,
  },
  focusTypeIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.grayLight, alignItems: 'center', justifyContent: 'center',
  },
  focusTypeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  focusTypeDesc: { fontSize: 12, color: COLORS.gray, lineHeight: 18 },
  catRow: { marginBottom: 16 },
  catInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orange, marginRight: 8 },
  catName: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.black },
  catVal: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  catTrack: { height: 6, backgroundColor: COLORS.grayLight, borderRadius: 3, overflow: 'hidden' },
  catFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 3 },
  emptyTxt: { fontSize: 13, color: COLORS.gray, fontStyle: 'italic' },
});
