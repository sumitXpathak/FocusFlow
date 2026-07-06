import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const GOAL_OPTIONS = [1, 2, 3, 4, 5];

// Defined at module scope — if this lived inside the component it would be
// recreated on every render, remounting the TextInput and dropping keyboard
// focus after each keystroke.
const Field = ({ label, value, onChange, placeholder, secure, keyboardType, showToggle, toggleState, onToggle, autoComplete, textContentType }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        secureTextEntry={secure && !toggleState}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={secure || keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        autoComplete={autoComplete}
        textContentType={textContentType}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
          <Ionicons name={toggleState ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const { register, markOnboardingComplete } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(3);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      // Account created — move into the app. Without this the navigator stays
      // on the Register screen and a successful sign-up appears to do nothing.
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      if (e.code === 'auth/configuration-not-found') {
        Alert.alert('Firebase Error', 'Email/Password authentication is not enabled in your Firebase Console. Please enable it in Authentication -> Sign-in method.');
      } else {
        Alert.alert('Registration failed', e.message);
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
          
          <View style={styles.headerWrap}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSub}>Start your focus journey today.</Text>
          </View>

          <View style={styles.card}>
            <Field 
              label="Full name" 
              value={name} 
              onChange={setName} 
              placeholder="John Doe" 
              autoComplete="name"
              textContentType="name"
            />
            <Field 
              label="Email address" 
              value={email} 
              onChange={setEmail} 
              placeholder="you@example.com" 
              keyboardType="email-address" 
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Field 
              label="Password" 
              value={password} 
              onChange={setPassword} 
              placeholder="Min 6 characters" 
              secure 
              showToggle 
              toggleState={showPass} 
              onToggle={() => setShowPass(!showPass)}
              textContentType="newPassword"
            />
            <Field 
              label="Confirm password" 
              value={confirm} 
              onChange={setConfirm} 
              placeholder="Repeat password" 
              secure 
              showToggle 
              toggleState={showConfirm} 
              onToggle={() => setShowConfirm(!showConfirm)}
              textContentType="newPassword"
            />

            {/* Goal picker */}
            <View style={styles.goalContainer}>
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
            </View>

            <TouchableOpacity
              style={[styles.regBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.regBtnTxt}>Sign Up</Text>
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
  scroll:   { paddingHorizontal: SIZES.padding, paddingBottom: 40 },
  backBtn:  { marginTop: 10, marginBottom: 20, width: 40, height: 40, justifyContent: 'center' },
  headerWrap: { marginBottom: 30 },
  headerTitle:{ fontSize: 32, fontWeight: '800', color: COLORS.black, letterSpacing: -0.5, marginBottom: 8 },
  headerSub:  { fontSize: 16, color: COLORS.gray },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 24, marginBottom: 24, ...SHADOWS.card,
  },
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
  goalContainer: { marginTop: 8, marginBottom: 24 },
  goalRow:     { flexDirection: 'row', gap: 8, marginTop: 4 },
  goalChip:    { flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  goalChipActive: { backgroundColor: COLORS.primary || COLORS.orange },
  goalChipTxt: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  goalChipTxtActive: { color: COLORS.white },
  regBtn:    { backgroundColor: COLORS.primary || COLORS.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...SHADOWS.small },
  regBtnTxt: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  loginRow:  { flexDirection: 'row', justifyContent: 'center' },
  loginGray: { fontSize: 15, color: COLORS.gray },
  loginLink: { fontSize: 15, color: COLORS.primary || COLORS.orange, fontWeight: '700' },
});
