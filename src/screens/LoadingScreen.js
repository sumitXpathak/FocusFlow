// src/screens/LoadingScreen.js
// Shown while Firebase auth state is resolving

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📵</Text>
      <Text style={styles.title}>FocusFlow</Text>
      <Text style={styles.sub}>Take back your screen time</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.orange}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 6,
    marginBottom: 32,
  },
  spinner: { marginTop: 8 },
});
