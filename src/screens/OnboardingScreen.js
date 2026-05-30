import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Dimensions,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1', emoji: '📵',
    title: 'Reclaim your time',
    sub:   'Track exactly how much time you spend on each app every day.',
    bg:    COLORS.orange,
  },
  {
    id: '2', emoji: '⏱',
    title: 'Focus like never before',
    sub:   'Pomodoro timer + app blocking keeps you in the zone and distraction-free.',
    bg:    COLORS.black,
  },
  {
    id: '3', emoji: '🔥',
    title: 'Build lasting habits',
    sub:   'Earn points, unlock badges, and keep your streak alive every day.',
    bg:    '#2D6A4F',
  },
  {
    id: '4', emoji: '🎯',
    title: 'Set your daily goal',
    sub:   'Choose how much screen time is healthy for you and stay on track.',
    bg:    '#6930C3',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const { markOnboardingComplete } = useAuth();

  function next() {
    if (current < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      markOnboardingComplete();
      navigation?.navigate('Login');
    }
  }

  function skip() {
    markOnboardingComplete();
    navigation?.navigate('Login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrent(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipTxt}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.nextBtn}>
          <Text style={styles.nextTxt}>
            {current === SLIDES.length - 1 ? 'Get started' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  slide:  { width, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emoji:  { fontSize: 72, marginBottom: 28 },
  title:  { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 14 },
  sub:    { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24 },
  dotsRow:{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  dot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.grayLight },
  dotActive: { backgroundColor: COLORS.orange, width: 20 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingBottom: 32 },
  skipBtn:{ padding: 14 },
  skipTxt:{ fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  nextBtn:{ backgroundColor: COLORS.orange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  nextTxt:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});
