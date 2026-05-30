import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const GOAL_OPTIONS = [1, 2, 3, 4, 5];

export default function RegisterScreen({ navigation }) {
  const { register, markOnboardingComplete } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(3);

  async function handleRegister() {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name, selectedGoal);
      markOnboardingComplete();
      // Navigation is handled by AuthContext auto-redirect
    } catch (e) {
      Alert.alert('Registration failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  const Field = ({ label, value, onChange, placeholder, secure, keyboardType }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        secureTextEntry={secure}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>📵</Text>
            <Text style={styles.logoTitle}>FocusFlow</Text>
            <Text style={styles.logoSub}>Start your focus journey</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create account</Text>
            <Text style={styles.cardSub}>It's free — no credit card needed</Text>

            <Field label="Full name"        value={name}     onChange={setName}     placeholder="Alex Kumar" />
            <Field label="Email"            value={email}    onChange={setEmail}    placeholder="you@example.com" keyboardType="email-address" />
            <Field label="Password"         value={password} onChange={setPassword} placeholder="Min 6 characters" secure />
            <Field label="Confirm password" value={confirm}  onChange={setConfirm}  placeholder="Repeat password" secure />

            {/* Goal picker */}
            <Text style={styles.label}>Daily screen time goal</Text>
            <View style={styles.goalRow}>
              {GOAL_OPTIONS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.goalChip, selectedGoal === g && styles.goalChipActive]}
                  onPress={() => setSelectedGoal(g)}
                >
                  <Text style={[styles.goalChipTxt, selectedGoal === g && styles.goalChipTxtActive]}>
                    {g}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.regBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.regBtnTxt}>Create account</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginGray}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation?.goBack()}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.background },
  scroll:   { paddingHorizontal: SIZES.padding, paddingVertical: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoEmoji:{ fontSize: 40, marginBottom: 6 },
  logoTitle:{ fontSize: 26, fontWeight: '800', color: COLORS.black, letterSpacing: -0.5 },
  logoSub:  { fontSize: 13, color: COLORS.gray, marginTop: 4 },
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
  goalRow:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  goalChip:    { flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  goalChipActive: { backgroundColor: COLORS.orange },
  goalChipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  goalChipTxtActive: { color: COLORS.white },
  regBtn:    { backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  regBtnTxt: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  loginRow:  { flexDirection: 'row', justifyContent: 'center' },
  loginGray: { fontSize: 13, color: COLORS.gray },
  loginLink: { fontSize: 13, color: COLORS.orange, fontWeight: '700' },
});
