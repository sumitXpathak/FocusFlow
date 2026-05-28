import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { loginUser } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>📵</Text>
          <Text style={styles.logoTitle}>FocusFlow</Text>
          <Text style={styles.logoSub}>Take back your screen time</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your account</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={styles.passInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={COLORS.gray}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={styles.eyeTxt}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation?.navigate('ForgotPassword')}>
            <Text style={styles.forgotTxt}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnTxt}>Sign in</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Register */}
        <View style={styles.registerRow}>
          <Text style={styles.registerGray}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
            <Text style={styles.registerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Skip for demo */}
        <TouchableOpacity onPress={() => navigation?.navigate('Main')} style={styles.skipBtn}>
          <Text style={styles.skipTxt}>Continue without account →</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  kav:  { flex: 1, justifyContent: 'center', paddingHorizontal: SIZES.padding },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 48, marginBottom: 8 },
  logoTitle: { fontSize: 28, fontWeight: '800', color: COLORS.black, letterSpacing: -0.5 },
  logoSub:   { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 24, marginBottom: 20, ...SHADOWS.card,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: COLORS.gray, marginBottom: 20 },
  label:     { fontSize: 12, fontWeight: '600', color: COLORS.black, marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: COLORS.grayLight, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.black, marginBottom: 14,
  },
  passWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.grayLight, borderRadius: 12, marginBottom: 8 },
  passInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.black },
  eyeBtn:    { paddingHorizontal: 12 },
  eyeTxt:    { fontSize: 16 },
  forgotTxt: { fontSize: 12, color: COLORS.orange, fontWeight: '600', textAlign: 'right', marginBottom: 20 },
  loginBtn:  { backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  loginBtnTxt: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  registerGray: { fontSize: 13, color: COLORS.gray },
  registerLink: { fontSize: 13, color: COLORS.orange, fontWeight: '700' },
  skipBtn:   { alignItems: 'center' },
  skipTxt:   { fontSize: 12, color: COLORS.gray },
});
