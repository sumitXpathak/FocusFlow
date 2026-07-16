import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  saveBlockingSchedules,
  getBlockingSchedules,
} from '../services/firestoreService';
import {
  DAY_LABELS,
  dayIndexToLabel,
  timeToMinutes,
  minutesToTime,
} from '../constants/data';

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`
);

export default function BlockingSchedulesScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const { apps, schedules: contextSchedules, dispatch } = useApp();

  // Local schedule state — initialized from context, synced back on save
  const [schedules, setSchedules] = useState(contextSchedules || []);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newName, setNewName]         = useState('');
  const [newEmoji, setNewEmoji]       = useState('📵');
  const [newDays, setNewDays]         = useState([]);          // numeric: 0=Mon…6=Sun
  const [newStart, setNewStart]       = useState('09:00');
  const [newEnd, setNewEnd]           = useState('17:00');
  const [newPackages, setNewPackages] = useState([]);          // package names
  const [showTimePicker, setShowTimePicker] = useState(null);  // 'start' | 'end'

  // Sync from context when it changes (Firestore load, etc.)
  useEffect(() => {
    if (contextSchedules && contextSchedules.length > 0) {
      setSchedules(contextSchedules);
    }
  }, [contextSchedules]);

  // Load schedules from Firestore on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      getBlockingSchedules(user.uid)
        .then(saved => {
          if (saved && saved.length > 0) {
            setSchedules(saved);
            dispatch({ type: 'SET_SCHEDULES', payload: saved });
          }
        })
        .catch(e => console.log('Load schedules error:', e.message));
    }
  }, [isAuthenticated, user]);

  // Push schedule changes to context + Firestore
  function commitSchedules(updated) {
    setSchedules(updated);
    dispatch({ type: 'SET_SCHEDULES', payload: updated });
    if (isAuthenticated && user) {
      saveBlockingSchedules(user.uid, updated)
        .catch(e => console.log('Save schedules error:', e.message));
    }
  }

  function toggleSchedule(id) {
    const updated = schedules.map(s =>
      s.id === id ? { ...s, active: !s.active } : s
    );
    commitSchedules(updated);
  }

  function deleteSchedule(id) {
    const updated = schedules.filter(s => s.id !== id);
    commitSchedules(updated);
  }

  function openNewModal() {
    setEditingSchedule(null);
    setNewName('');
    setNewEmoji('📵');
    setNewDays([]);
    setNewStart('09:00');
    setNewEnd('17:00');
    setNewPackages([]);
    setShowModal(true);
  }

  function openEditModal(schedule) {
    setEditingSchedule(schedule.id);
    setNewName(schedule.name);
    setNewEmoji(schedule.emoji);
    setNewDays([...(schedule.days || [])]);
    setNewStart(minutesToTime(schedule.startMinutes || 0));
    setNewEnd(minutesToTime(schedule.endMinutes || 0));
    setNewPackages([...(schedule.packages || [])]);
    setShowModal(true);
  }

  function toggleDay(dayIndex) {
    setNewDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  }

  function togglePackage(packageName) {
    setNewPackages(prev =>
      prev.includes(packageName) ? prev.filter(p => p !== packageName) : [...prev, packageName]
    );
  }

  function saveSchedule() {
    if (!newName.trim() || newDays.length === 0 || newPackages.length === 0) return;
    const colors = [COLORS.orange, '#22C55E', '#8B5CF6', '#EF4444', '#06B6D4'];
    const scheduleData = {
      name: newName,
      emoji: newEmoji,
      days: newDays,
      startMinutes: timeToMinutes(newStart),
      endMinutes: timeToMinutes(newEnd),
      packages: newPackages,
    };

    let updatedSchedules;
    if (editingSchedule) {
      updatedSchedules = schedules.map(s =>
        s.id === editingSchedule ? { ...s, ...scheduleData } : s
      );
    } else {
      const newSchedule = {
        id: Date.now().toString(),
        ...scheduleData,
        active: true,
        color: colors[schedules.length % colors.length],
      };
      updatedSchedules = [...schedules, newSchedule];
    }
    commitSchedules(updatedSchedules);
    setShowModal(false);
  }

  function formatDays(days) {
    if (!days || days.length === 0) return '';
    if (days.length === 7) return 'Every day';
    const sorted = [...days].sort();
    const weekdays = [0, 1, 2, 3, 4];
    const weekends = [5, 6];
    if (JSON.stringify(sorted) === JSON.stringify(weekdays)) return 'Weekdays';
    if (JSON.stringify(sorted) === JSON.stringify(weekends)) return 'Weekends';
    return sorted.map(d => dayIndexToLabel(d)).join(', ');
  }

  /** Look up display name from installed apps list */
  function getAppName(packageName) {
    const app = apps.find(a => a.packageName === packageName);
    return app?.name || packageName.split('.').pop();
  }

  const activeCount = schedules.filter(s => s.active).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>Manage your time</Text>
          <Text style={styles.headerTitle}>Blocking Schedules</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openNewModal}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Banner */}
        <View style={styles.summaryBanner}>
          <Text style={{ fontSize: 28 }}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>
              {activeCount} active schedule{activeCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.summarySub}>
              Apps blocked automatically during set hours
            </Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeTxt}>{schedules.length} total</Text>
          </View>
        </View>

        {/* Schedule Cards */}
        <Text style={styles.sectionLabel}>YOUR SCHEDULES</Text>
        {schedules.map(schedule => (
          <View key={schedule.id} style={styles.scheduleCard}>
            {/* Top Row */}
            <View style={styles.cardTop}>
              <View style={[styles.scheduleIconWrap, { backgroundColor: (schedule.color || COLORS.orange) + '20' }]}>
                <Text style={styles.scheduleEmoji}>{schedule.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleName}>{schedule.name}</Text>
                <Text style={styles.scheduleDays}>{formatDays(schedule.days)}</Text>
              </View>
              {/* Toggle */}
              <TouchableOpacity
                style={[styles.toggle, schedule.active && styles.toggleOn, { backgroundColor: schedule.active ? (schedule.color || COLORS.orange) : '#E5E7EB' }]}
                onPress={() => toggleSchedule(schedule.id)}
              >
                <View style={[styles.knob, schedule.active && styles.knobOn]} />
              </TouchableOpacity>
            </View>

            {/* Time Row */}
            <View style={styles.timeRow}>
              <View style={styles.timeChip}>
                <Ionicons name="time-outline" size={13} color={COLORS.gray} />
                <Text style={styles.timeText}>
                  {minutesToTime(schedule.startMinutes || 0)} – {minutesToTime(schedule.endMinutes || 0)}
                </Text>
              </View>
              <View style={styles.appCount}>
                <Ionicons name="apps-outline" size={13} color={COLORS.gray} />
                <Text style={styles.timeText}>{(schedule.packages || []).length} apps blocked</Text>
              </View>
            </View>

            {/* App Pills */}
            <View style={styles.appPills}>
              {(schedule.packages || []).slice(0, 4).map(pkg => (
                <View key={pkg} style={[styles.appPill, { borderColor: (schedule.color || COLORS.orange) + '40', backgroundColor: (schedule.color || COLORS.orange) + '10' }]}>
                  <Text style={[styles.appPillTxt, { color: schedule.color || COLORS.orange }]}>{getAppName(pkg)}</Text>
                </View>
              ))}
              {(schedule.packages || []).length > 4 && (
                <View style={styles.appPill}>
                  <Text style={styles.appPillTxt}>+{schedule.packages.length - 4} more</Text>
                </View>
              )}
            </View>

            {/* Status bar */}
            {schedule.active && (
              <View style={[styles.activeBar, { backgroundColor: schedule.color || COLORS.orange }]}>
                <Ionicons name="shield-checkmark" size={11} color={COLORS.white} />
                <Text style={styles.activeBarTxt}>Active — blocking during set hours</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn2} onPress={() => openEditModal(schedule)}>
                <Ionicons name="pencil-outline" size={14} color={COLORS.black} />
                <Text style={styles.editBtnTxt}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteSchedule(schedule.id)}>
                <Ionicons name="trash-outline" size={14} color={COLORS.red} />
                <Text style={styles.deleteBtnTxt}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Empty State */}
        {schedules.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
            <Text style={styles.emptyTitle}>No schedules yet</Text>
            <Text style={styles.emptySub}>Tap + to create your first blocking schedule</Text>
          </View>
        )}

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Pro tip</Text>
            <Text style={styles.tipText}>
              Set a "Work Hours" schedule to block social media 9–5, then a "Bedtime" schedule to wind down before sleep.
            </Text>
          </View>
        </View>

        {/* Add New Button */}
        <TouchableOpacity style={styles.addNewBtn} onPress={openNewModal}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.orange} />
          <Text style={styles.addNewTxt}>Create new schedule</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </Text>
            <TouchableOpacity onPress={saveSchedule}>
              <Text style={[styles.modalSave, (!newName || newDays.length === 0 || newPackages.length === 0) && { opacity: 0.4 }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.fieldLabel}>SCHEDULE NAME</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Work Hours, Bedtime..."
                placeholderTextColor={COLORS.gray}
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            {/* Emoji */}
            <Text style={styles.fieldLabel}>ICON</Text>
            <View style={styles.emojiRow}>
              {['📵','💼','🌅','🌙','🎯','📚','🏋️','🍽️'].map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, newEmoji === e && styles.emojiBtnActive]}
                  onPress={() => setNewEmoji(e)}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Days — using numeric indices */}
            <Text style={styles.fieldLabel}>DAYS</Text>
            <View style={styles.daysRow}>
              {DAY_LABELS.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayBtn, newDays.includes(idx) && styles.dayBtnActive]}
                  onPress={() => toggleDay(idx)}
                >
                  <Text style={[styles.dayTxt, newDays.includes(idx) && styles.dayTxtActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick day selectors */}
            <View style={styles.quickDays}>
              {[
                { label: 'Every day', days: [0,1,2,3,4,5,6] },
                { label: 'Weekdays', days: [0,1,2,3,4] },
                { label: 'Weekends', days: [5,6] },
              ].map(preset => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.quickDayBtn}
                  onPress={() => setNewDays(preset.days)}
                >
                  <Text style={styles.quickDayTxt}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time */}
            <Text style={styles.fieldLabel}>TIME RANGE</Text>
            <View style={styles.timePickerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timePickerLabel}>Start</Text>
                <TouchableOpacity
                  style={styles.timePickerBtn}
                  onPress={() => setShowTimePicker(showTimePicker === 'start' ? null : 'start')}
                >
                  <Ionicons name="time-outline" size={16} color={COLORS.orange} />
                  <Text style={styles.timePickerVal}>{newStart}</Text>
                </TouchableOpacity>
                {showTimePicker === 'start' && (
                  <ScrollView style={styles.hourList} nestedScrollEnabled>
                    {HOURS.map(h => (
                      <TouchableOpacity key={h} style={[styles.hourItem, newStart === h && styles.hourItemActive]}
                        onPress={() => { setNewStart(h); setShowTimePicker(null); }}>
                        <Text style={[styles.hourTxt, newStart === h && styles.hourTxtActive]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              <View style={styles.timeDash}><Text style={{ color: COLORS.gray }}>→</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timePickerLabel}>End</Text>
                <TouchableOpacity
                  style={styles.timePickerBtn}
                  onPress={() => setShowTimePicker(showTimePicker === 'end' ? null : 'end')}
                >
                  <Ionicons name="time-outline" size={16} color={COLORS.orange} />
                  <Text style={styles.timePickerVal}>{newEnd}</Text>
                </TouchableOpacity>
                {showTimePicker === 'end' && (
                  <ScrollView style={styles.hourList} nestedScrollEnabled>
                    {HOURS.map(h => (
                      <TouchableOpacity key={h} style={[styles.hourItem, newEnd === h && styles.hourItemActive]}
                        onPress={() => { setNewEnd(h); setShowTimePicker(null); }}>
                        <Text style={[styles.hourTxt, newEnd === h && styles.hourTxtActive]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Apps — real installed apps from device */}
            <Text style={styles.fieldLabel}>APPS TO BLOCK</Text>
            {apps.length === 0 ? (
              <View style={styles.validationNote}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.gray} />
                <Text style={styles.validationTxt}>
                  No installed apps detected. Grant Usage Access permission to see your apps.
                </Text>
              </View>
            ) : (
              <View style={styles.appGrid}>
                {apps.map(app => (
                  <TouchableOpacity
                    key={app.packageName}
                    style={[styles.appToggle, newPackages.includes(app.packageName) && styles.appToggleActive]}
                    onPress={() => togglePackage(app.packageName)}
                  >
                    {newPackages.includes(app.packageName) && (
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.orange} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.appToggleTxt, newPackages.includes(app.packageName) && styles.appToggleTxtActive]}>
                      {app.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {newName.trim() === '' || newDays.length === 0 || newPackages.length === 0 ? (
              <View style={styles.validationNote}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.gray} />
                <Text style={styles.validationTxt}>
                  Fill in name, select at least one day and one app to save.
                </Text>
              </View>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingTop: 12, paddingBottom: 8, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.card,
  },
  headerSub: { fontSize: 12, color: COLORS.gray },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black, letterSpacing: -0.3 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.orange,
    alignItems: 'center', justifyContent: 'center', marginLeft: 'auto',
  },
  summaryBanner: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.black, borderRadius: SIZES.radius,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  summarySub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  summaryBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  summaryBadgeTxt: { fontSize: 11, color: COLORS.white, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray,
    letterSpacing: 0.8, paddingHorizontal: SIZES.padding, marginBottom: 8,
  },
  scheduleCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    overflow: 'hidden', ...SHADOWS.card,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14, paddingBottom: 8,
  },
  scheduleIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  scheduleEmoji: { fontSize: 22 },
  scheduleName: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  scheduleDays: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    position: 'relative', flexShrink: 0,
  },
  toggleOn: {},
  knob: {
    position: 'absolute', top: 3, left: 3,
    width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.white,
  },
  knobOn: { left: 23 },
  timeRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 14, paddingBottom: 8,
  },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  appCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: COLORS.gray },
  appPills: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 6, paddingHorizontal: 14, paddingBottom: 10,
  },
  appPill: {
    borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.grayBorder,
    paddingHorizontal: 8, paddingVertical: 3, backgroundColor: COLORS.grayLight,
  },
  appPillTxt: { fontSize: 10, fontWeight: '600', color: COLORS.gray },
  activeBar: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 6, marginHorizontal: 14,
    borderRadius: 8, marginBottom: 8,
  },
  activeBarTxt: { fontSize: 10, fontWeight: '600', color: COLORS.white },
  cardActions: {
    flexDirection: 'row', borderTopWidth: 0.5,
    borderTopColor: COLORS.grayLight, padding: 10, gap: 8,
  },
  editBtn2: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: COLORS.grayLight, borderRadius: 10, paddingVertical: 8,
  },
  editBtnTxt: { fontSize: 12, fontWeight: '600', color: COLORS.black },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: '#FEE2E2', borderRadius: 10, paddingVertical: 8,
  },
  deleteBtnTxt: { fontSize: 12, fontWeight: '600', color: COLORS.red },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  tipCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.orangeLight, borderRadius: SIZES.radius,
    padding: 14, flexDirection: 'row', gap: 10,
  },
  tipEmoji: { fontSize: 20 },
  tipTitle: { fontSize: 12, fontWeight: '700', color: COLORS.orange, marginBottom: 3 },
  tipText: { fontSize: 11, color: COLORS.black, lineHeight: 16 },
  addNewBtn: {
    marginHorizontal: SIZES.padding, backgroundColor: COLORS.white,
    borderRadius: SIZES.radius, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: COLORS.orange, borderStyle: 'dashed',
  },
  addNewTxt: { fontSize: 14, fontWeight: '700', color: COLORS.orange },
  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.grayBorder,
    backgroundColor: COLORS.white,
  },
  modalCancel: { fontSize: 15, color: COLORS.gray },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  modalSave: { fontSize: 15, fontWeight: '700', color: COLORS.orange },
  modalBody: { flex: 1, padding: SIZES.padding },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.gray,
    letterSpacing: 0.8, marginBottom: 8, marginTop: 16,
  },
  inputWrap: {
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.grayBorder, overflow: 'hidden',
  },
  input: { padding: 14, fontSize: 15, color: COLORS.black },
  emojiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  emojiBtnActive: { borderColor: COLORS.orange, borderWidth: 2, backgroundColor: COLORS.orangeLight },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  dayBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  dayBtnActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  dayTxt: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  dayTxtActive: { color: COLORS.white },
  quickDays: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  quickDayBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: COLORS.grayLight,
  },
  quickDayTxt: { fontSize: 11, color: COLORS.black, fontWeight: '500' },
  timePickerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timePickerLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  timePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  timePickerVal: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  timeDash: { paddingTop: 28 },
  hourList: {
    maxHeight: 150, backgroundColor: COLORS.white,
    borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.grayBorder,
    marginTop: 4,
  },
  hourItem: { paddingHorizontal: 14, paddingVertical: 10 },
  hourItemActive: { backgroundColor: COLORS.orangeLight },
  hourTxt: { fontSize: 14, color: COLORS.black },
  hourTxtActive: { color: COLORS.orange, fontWeight: '700' },
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  appToggle: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.white, borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  appToggleActive: { backgroundColor: COLORS.orangeLight, borderColor: COLORS.orange },
  appToggleTxt: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  appToggleTxtActive: { color: COLORS.orange },
  validationNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, backgroundColor: COLORS.grayLight,
    borderRadius: 10, padding: 10,
  },
  validationTxt: { fontSize: 11, color: COLORS.gray, flex: 1 },
});
