import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { resetPassword } from '../services/authService';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmed)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(trimmed);
      setSent(true);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        Alert.alert('Not found', 'No account found with that email address.');
      } else {
        Alert.alert('Error', e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>

          {!sent ? (
            <>
              <View style={styles.iconWrap}>
                <Ionicons name="key-outline" size={48} color={COLORS.orange} />
              </View>

              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.sub}>
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </Text>

              <View style={styles.card}>
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

                <TouchableOpacity
                  style={[styles.resetBtn, loading && { opacity: 0.7 }]}
                  onPress={handleReset}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.resetBtnTxt}>Send reset link</Text>
                  }
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation?.goBack()}
                style={styles.backLink}
              >
                <Ionicons name="arrow-back" size={16} color={COLORS.orange} />
                <Text style={styles.backLinkTxt}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={72} color={COLORS.green} />
              </View>

              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.sub}>
                We've sent a password reset link to{'\n'}
                <Text style={{ fontWeight: '700', color: COLORS.black }}>{email.trim()}</Text>
                {'\n\n'}
                It may take a minute to arrive. Remember to check your spam folder.
              </Text>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => navigation?.goBack()}
              >
                <Text style={styles.resetBtnTxt}>Back to sign in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReset}
                style={styles.resendBtn}
              >
                <Text style={styles.resendTxt}>Didn't receive it? Send again</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SIZES.padding, paddingVertical: 20, flexGrow: 1 },
  backBtn: { marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 24,
  },
  successIconWrap: {
    alignItems: 'center', marginBottom: 24, marginTop: 40,
  },
  title: {
    fontSize: 28, fontWeight: '800', color: COLORS.black,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 12,
  },
  sub: {
    fontSize: 15, color: COLORS.gray, textAlign: 'center',
    lineHeight: 22, marginBottom: 30, paddingHorizontal: 10,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 24, marginBottom: 24, ...SHADOWS.card,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  inputWrap: {
    backgroundColor: COLORS.grayLight, borderRadius: 14,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 20,
  },
  input: {
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: COLORS.black,
  },
  resetBtn: {
    backgroundColor: COLORS.orange, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginHorizontal: SIZES.padding,
    ...SHADOWS.small,
  },
  resetBtnTxt: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  backLink: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginTop: 20,
  },
  backLinkTxt: { fontSize: 14, fontWeight: '600', color: COLORS.orange },
  resendBtn: { alignItems: 'center', marginTop: 20, padding: 10 },
  resendTxt: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
});
