import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { login, markOnboardingComplete } = useAuth();
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
      await login(email, password);
      markOnboardingComplete();
    } catch (e) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    markOnboardingComplete();
    navigation.replace('Main');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>📵</Text>
            <Text style={styles.logoTitle}>FocusFlow</Text>
            <Text style={styles.logoSub}>Take back your screen time</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account to continue</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  textContentType="password"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation?.navigate('ForgotPassword')} style={styles.forgotBtn}>
              <Text style={styles.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnTxt}>Sign In</Text>
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
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipTxt}>Continue without account →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SIZES.padding, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoEmoji: { fontSize: 56, marginBottom: 12 },
  logoTitle: { fontSize: 32, fontWeight: '800', color: COLORS.black, letterSpacing: -0.5 },
  logoSub:   { fontSize: 16, color: COLORS.gray, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 24, marginBottom: 32, ...SHADOWS.card,
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black, marginBottom: 6 },
  cardSub:   { fontSize: 14, color: COLORS.gray, marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label:     { fontSize: 13, fontWeight: '600', color: COLORS.black, marginBottom: 8, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.black,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: 4 },
  forgotTxt: { fontSize: 13, color: COLORS.primary || COLORS.orange, fontWeight: '700' },
  loginBtn:  { backgroundColor: COLORS.primary || COLORS.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...SHADOWS.small },
  loginBtnTxt: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  registerGray: { fontSize: 15, color: COLORS.gray },
  registerLink: { fontSize: 15, color: COLORS.primary || COLORS.orange, fontWeight: '700' },
  skipBtn:   { alignItems: 'center', padding: 10 },
  skipTxt:   { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
});
