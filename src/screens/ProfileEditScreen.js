import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6];

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

export default function ProfileEditScreen({ navigation }) {
  const {
    user, userProfile, isAuthenticated,
    updateDisplayName, sendVerificationEmail, deleteAccount,
    changePassword, refreshProfile, updateDailyGoal,
  } = useAuth();

  const [name, setName] = useState(userProfile?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(userProfile?.dailyGoalHours || 3);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const email = userProfile?.email || user?.email || '';
  const initials = getInitials(name || userProfile?.displayName);
  const emailVerified = user?.emailVerified ?? false;

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      if (name.trim() !== userProfile?.displayName) {
        await updateDisplayName(name.trim());
      }
      if (selectedGoal !== userProfile?.dailyGoalHours) {
        await updateDailyGoal(selectedGoal);
      }
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation?.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendVerification() {
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
      Alert.alert(
        'Verification sent',
        `We've sent a verification link to ${email}. Check your inbox (and spam folder).`
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Required', 'Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Your password has been changed.');
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'Current password is incorrect.');
      } else {
        Alert.alert('Error', e.message);
      }
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      Alert.alert('Required', 'Enter your password to confirm account deletion.');
      return;
    }
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(deletePassword);
              navigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e) {
              if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                Alert.alert('Error', 'Incorrect password. Please try again.');
              } else {
                Alert.alert('Error', e.message);
              }
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={styles.saveBtnTxt}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
            <Text style={styles.emailText}>{email}</Text>
            {!emailVerified && (
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={handleSendVerification}
                disabled={verificationSent}
              >
                <Ionicons name="mail-outline" size={14} color={verificationSent ? COLORS.green : COLORS.orange} />
                <Text style={[styles.verifyTxt, verificationSent && { color: COLORS.green }]}>
                  {verificationSent ? 'Verification sent ✓' : 'Verify email address'}
                </Text>
              </TouchableOpacity>
            )}
            {emailVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                <Text style={styles.verifiedTxt}>Email verified</Text>
              </View>
            )}
          </View>

          {/* Name Field */}
          <Text style={styles.groupLabel}>PERSONAL INFO</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={COLORS.gray}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Daily Goal */}
          <Text style={styles.groupLabel}>DAILY SCREEN TIME GOAL</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Hours per day</Text>
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

          {/* Password Change */}
          <Text style={styles.groupLabel}>SECURITY</Text>
          <View style={styles.card}>
            {!showPasswordChange ? (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => setShowPasswordChange(true)}
              >
                <Ionicons name="key-outline" size={18} color={COLORS.orange} />
                <Text style={styles.actionLabel}>Change password</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>Current password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>New password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.pwBtnRow}>
                  <TouchableOpacity
                    style={styles.pwCancelBtn}
                    onPress={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword('');
                      setNewPassword('');
                    }}
                  >
                    <Text style={styles.pwCancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pwSaveBtn} onPress={handleChangePassword}>
                    <Text style={styles.pwSaveTxt}>Change password</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Delete Account */}
          <Text style={styles.groupLabel}>DANGER ZONE</Text>
          <View style={[styles.card, { borderWidth: 1, borderColor: '#FCA5A5' }]}>
            {!showDeleteConfirm ? (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                <Text style={[styles.actionLabel, { color: COLORS.red }]}>Delete account</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.red} />
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={styles.dangerText}>
                  This will permanently delete your account, all progress, sessions, and statistics.
                  This action cannot be undone.
                </Text>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Enter your password to confirm</Text>
                <TextInput
                  style={styles.input}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Your password"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.pwBtnRow}>
                  <TouchableOpacity
                    style={styles.pwCancelBtn}
                    onPress={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                  >
                    <Text style={styles.pwCancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                    <Text style={styles.deleteBtnTxt}>Delete permanently</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.card,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  saveBtn: {
    backgroundColor: COLORS.orange, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  saveBtnTxt: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarTxt: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  emailText: { fontSize: 13, color: COLORS.gray, marginBottom: 6 },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.orangeLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  verifyTxt: { fontSize: 12, fontWeight: '600', color: COLORS.orange },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.greenLight, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  verifiedTxt: { fontSize: 12, fontWeight: '600', color: COLORS.green },
  groupLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray,
    letterSpacing: 0.8, paddingHorizontal: SIZES.padding,
    marginBottom: 6, marginTop: 4,
  },
  card: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 16, ...SHADOWS.card,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.grayLight, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.black,
  },
  goalRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  goalChip: {
    flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  goalChipActive: { backgroundColor: COLORS.orange },
  goalChipTxt: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  goalChipTxtActive: { color: COLORS.white },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.black, flex: 1 },
  pwBtnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  pwCancelBtn: {
    flex: 1, backgroundColor: COLORS.grayLight, borderRadius: 12,
    paddingVertical: 11, alignItems: 'center',
  },
  pwCancelTxt: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  pwSaveBtn: {
    flex: 1, backgroundColor: COLORS.orange, borderRadius: 12,
    paddingVertical: 11, alignItems: 'center',
  },
  pwSaveTxt: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  deleteBtn: {
    flex: 1, backgroundColor: COLORS.red, borderRadius: 12,
    paddingVertical: 11, alignItems: 'center',
  },
  deleteBtnTxt: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  dangerText: { fontSize: 12, color: COLORS.red, lineHeight: 18 },
});
