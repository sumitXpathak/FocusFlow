import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, getUserRank } from '../services/firestoreService';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

function LeaderboardRow({ entry, isCurrentUser }) {
  const rankDisplay = entry.rank <= 3
    ? MEDAL_EMOJIS[entry.rank - 1]
    : `#${entry.rank}`;

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <Text style={[styles.rank, entry.rank <= 3 && { fontSize: 20 }]}>
        {rankDisplay}
      </Text>
      <View style={[
        styles.rowAvatar,
        { backgroundColor: isCurrentUser ? COLORS.orange : COLORS.grayLight }
      ]}>
        <Text style={[styles.rowAvatarTxt, isCurrentUser && { color: COLORS.white }]}>
          {getInitials(entry.displayName)}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>
          {entry.displayName || 'Anonymous'}
          {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
        </Text>
        <Text style={styles.rowSub}>
          Level {entry.level || 1} · {entry.streak || 0} day streak
        </Text>
      </View>
      <View style={styles.rowPts}>
        <Text style={styles.rowPtsTxt}>{(entry.points || 0).toLocaleString()}</Text>
        <Text style={styles.rowPtsLabel}>pts</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [userRankData, setUserRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('all');

  async function loadLeaderboard() {
    try {
      const data = await getLeaderboard(50);
      setLeaders(data);

      if (isAuthenticated && user) {
        const rank = await getUserRank(user.uid);
        setUserRankData(rank);
      }
    } catch (e) {
      console.log('Leaderboard error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadLeaderboard();
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.black} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSub}>Community</Text>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Your rank card */}
      {userRankData && (
        <View style={styles.rankCard}>
          <View style={styles.rankCardRow}>
            <View style={styles.rankItem}>
              <Text style={styles.rankBig}>#{userRankData.rank || '—'}</Text>
              <Text style={styles.rankLabel}>Your rank</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankItem}>
              <Text style={styles.rankBig}>Top {userRankData.percentile || 0}%</Text>
              <Text style={styles.rankLabel}>Percentile</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.rankItem}>
              <Text style={styles.rankBig}>{userRankData.total || 0}</Text>
              <Text style={styles.rankLabel}>Players</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['all', 'weekly'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'all' ? 'All Time' : 'This Week'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.orange} />
          <Text style={styles.loadingTxt}>Loading leaderboard...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Top 3 podium */}
          {leaders.length >= 3 && (
            <View style={styles.podium}>
              {[1, 0, 2].map(podiumIdx => {
                const entry = leaders[podiumIdx];
                if (!entry) return null;
                const isMe = isAuthenticated && entry.uid === user?.uid;
                return (
                  <View key={entry.uid} style={[styles.podiumItem, podiumIdx === 0 && styles.podiumFirst]}>
                    <Text style={styles.podiumMedal}>{MEDAL_EMOJIS[podiumIdx]}</Text>
                    <View style={[
                      styles.podiumAvatar,
                      { backgroundColor: isMe ? COLORS.orange : COLORS.grayLight },
                      podiumIdx === 0 && { width: 56, height: 56, borderRadius: 28 },
                    ]}>
                      <Text style={[styles.podiumAvatarTxt, isMe && { color: COLORS.white }]}>
                        {getInitials(entry.displayName)}
                      </Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {entry.displayName || 'Anon'}
                    </Text>
                    <Text style={styles.podiumPts}>{(entry.points || 0).toLocaleString()} pts</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Remaining list */}
          {leaders.slice(3).map(entry => (
            <LeaderboardRow
              key={entry.uid}
              entry={entry}
              isCurrentUser={isAuthenticated && entry.uid === user?.uid}
            />
          ))}

          {leaders.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🏆</Text>
              <Text style={styles.emptyTitle}>No competitors yet</Text>
              <Text style={styles.emptySub}>Complete focus sessions to appear on the leaderboard!</Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
  rankCard: {
    marginHorizontal: SIZES.padding, marginBottom: 12,
    backgroundColor: COLORS.orange, borderRadius: SIZES.radiusLg, padding: 18,
  },
  rankCardRow: { flexDirection: 'row', alignItems: 'center' },
  rankItem: { flex: 1, alignItems: 'center' },
  rankBig: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  rankLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  rankDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: SIZES.padding, gap: 8, marginBottom: 12,
  },
  tabPill: {
    backgroundColor: COLORS.white, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 0.5, borderColor: COLORS.grayBorder,
  },
  tabPillActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  tabTxt: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  tabTxtActive: { color: COLORS.white },
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    paddingHorizontal: SIZES.padding, paddingVertical: 16, gap: 12, marginBottom: 8,
  },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginBottom: 12 },
  podiumMedal: { fontSize: 22, marginBottom: 6 },
  podiumAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  podiumAvatarTxt: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  podiumName: { fontSize: 11, fontWeight: '600', color: COLORS.black, textAlign: 'center' },
  podiumPts: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: SIZES.padding, marginBottom: 6,
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 12, ...SHADOWS.card,
  },
  rowHighlight: { borderWidth: 1.5, borderColor: COLORS.orange },
  rank: { fontSize: 14, fontWeight: '700', color: COLORS.gray, width: 30, textAlign: 'center' },
  rowAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  rowAvatarTxt: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  rowBody: { flex: 1 },
  rowName: { fontSize: 13, fontWeight: '600', color: COLORS.black },
  youBadge: { fontSize: 11, fontWeight: '700', color: COLORS.orange },
  rowSub: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  rowPts: { alignItems: 'flex-end' },
  rowPtsTxt: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  rowPtsLabel: { fontSize: 9, color: COLORS.gray },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingTxt: { fontSize: 13, color: COLORS.gray, marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 40 },
});
