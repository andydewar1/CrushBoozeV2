import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Pencil, Trash2, Clock, TrendingDown, Star, Settings, BarChart2, Lock, Zap } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useCravingLogs, CravingLog } from '@/hooks/useCravingLogs';
import LogModal from '@/components/LogModal';

const TIME_GROUPS = [
  { label: 'Morning', emoji: '🌅', start: 6, end: 12 },
  { label: 'Afternoon', emoji: '☀️', start: 12, end: 18 },
  { label: 'Evening', emoji: '🌆', start: 18, end: 24 },
  { label: 'Night', emoji: '🌙', start: 0, end: 6 },
];

const INSIGHTS_UNLOCK_AT = 3;

export default function LogsScreen() {
  const router = useRouter();
  const { logs, stats, loading, error, addCravingLog, updateCravingLog, deleteCravingLog } = useCravingLogs();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<CravingLog | null>(null);

  const insightsUnlocked = logs.length >= INSIGHTS_UNLOCK_AT;
  const logsNeeded = INSIGHTS_UNLOCK_AT - logs.length;

  const timeGroupCounts = useMemo(
    () =>
      TIME_GROUPS.map(g =>
        logs.filter(log => {
          const h = log.timestamp.getHours();
          return h >= g.start && h < g.end;
        }).length
      ),
    [logs]
  );

  const maxGroupCount = useMemo(() => Math.max(...timeGroupCounts, 1), [timeGroupCounts]);

  const peakSlotIndex = useMemo(() => {
    const max = Math.max(...timeGroupCounts, 0);
    if (max === 0) return -1;
    return timeGroupCounts.indexOf(max);
  }, [timeGroupCounts]);

  const topTrigger = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (log.trigger) counts[log.trigger] = (counts[log.trigger] || 0) + 1;
    });
    const keys = Object.keys(counts);
    if (!keys.length) return null;
    return keys.sort((a, b) => counts[b] - counts[a])[0];
  }, [logs]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return '#03045e';    // Green for low
    if (intensity <= 6) return '#FF9500';    // Orange for medium
    return '#FF6B47';                        // Red for high
  };

  const getEmojiForIntensity = (intensity: number) => {
    switch (intensity) {
      case 1: return '😊';  // Happy
      case 2: return '🙂';  // Slightly happy
      case 3: return '😐';  // Neutral/middle
      case 4: return '😕';  // Slightly concerned
      case 5: return '😟';  // Slightly annoyed
      case 6: return '😠';  // Annoyed
      case 7: return '😡';  // Angry
      case 8: return '🤬';  // Very angry
      case 9: return '😤';  // Furious
      case 10: return '🔥'; // Overwhelming
      default: return '😐';
    }
  };

  const handleAddLog = () => {
    setEditingLog(null);
    setModalVisible(true);
  };

  const handleEditLog = (log: CravingLog) => {
    setEditingLog(log);
    setModalVisible(true);
  };

  const handleDeleteLog = (log: CravingLog) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this urge log?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCravingLog(log.id);
            if (!success) {
              Alert.alert('Error', 'Failed to delete log. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveLog = async (logData: Omit<CravingLog, 'id'>) => {
    const result = await addCravingLog(logData);
    if (!result) {
      throw new Error('Failed to save log');
    }
  };

  const handleUpdateLog = async (logId: string, updates: Partial<Omit<CravingLog, 'id'>>) => {
    const result = await updateCravingLog(logId, updates);
    if (!result) {
      throw new Error('Failed to update log');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingLog(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#03045e" />
          <Text style={styles.loadingText}>Loading your logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load logs</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Logs</Text>
            <Text style={styles.pageSubtitle}>Know your triggers and beat them.</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats — single premium card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <Clock size={18} color="#03045e" />
            </View>
            <Text style={styles.statNumberPremium}>{stats.totalLogs}</Text>
            <Text style={styles.statLabelCaps}>Total logs</Text>
          </View>
          <View style={styles.statDividerVert} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, styles.statIconCircleWarm]}>
              <TrendingDown size={18} color="#FF6B47" />
            </View>
            <Text style={styles.statNumberPremium}>{stats.averageIntensity.toFixed(1)}</Text>
            <Text style={styles.statLabelCaps}>Avg intensity</Text>
          </View>
          <View style={styles.statDividerVert} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, styles.statIconCircleWarm]}>
              <Star size={18} color="#FF6B47" />
            </View>
            <Text style={styles.statNumberPremium}>{stats.highIntensityCount}</Text>
            <Text style={styles.statLabelCaps}>High intensity</Text>
          </View>
        </View>

        <View style={styles.logButtonWrap}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddLog} activeOpacity={0.88}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Log an urge</Text>
          </TouchableOpacity>
        </View>

        {/* Urge patterns — same visual language as Home daily check-in */}
        <View style={styles.section}>
          <View style={styles.patternsHeaderBlock}>
            <View style={styles.patternsHeaderRow}>
              <View style={styles.patternsTitleCluster}>
                <View style={styles.patternsSectionHeader}>
                  <BarChart2 size={20} color="#03045e" />
                  <Text style={[styles.sectionTitle, styles.patternsSectionTitle]}>Your Urge Patterns</Text>
                </View>
                <View style={styles.patternsSubtitleLines}>
                  <Text style={styles.patternsSubtitleLine}>See when urges hit hardest.</Text>
                </View>
              </View>
              <View style={styles.patternsBadgeCol}>
                <View style={styles.patternsStreakPill}>
                  {insightsUnlocked ? (
                    <View style={styles.patternsStreakInline}>
                      <Text style={styles.patternsStreakCount}>{logs.length}</Text>
                      <Text style={styles.patternsStreakCaptionInline}>Logs</Text>
                    </View>
                  ) : (
                    <View style={styles.patternsStreakInline}>
                      <View style={styles.patternsStreakBadge}>
                        <Text style={styles.patternsStreakCount}>{logs.length}</Text>
                        <Text style={styles.patternsStreakSlash}>/{INSIGHTS_UNLOCK_AT}</Text>
                      </View>
                      <Text style={styles.patternsStreakCaptionInline}>To unlock</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {!insightsUnlocked ? (
            <View style={styles.patternsLockedSurface}>
              <View style={styles.patternsLockIconWrap}>
                <Lock size={22} color="#03045e" />
              </View>
              <Text style={styles.patternsLockedTitle}>
                Your urge data will appear here once you have logged {INSIGHTS_UNLOCK_AT} urges.
              </Text>
              <Text style={styles.patternsLockedSubtitle}>
                Log {logsNeeded} more urge{logsNeeded !== 1 ? 's' : ''} to see time-of-day peaks and what shows up most often.
              </Text>
              <View style={styles.lockedDots}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[styles.lockedDot, i < logs.length && styles.lockedDotFilled]} />
                ))}
              </View>
              <Text style={styles.lockedProgress}>{logs.length} of {INSIGHTS_UNLOCK_AT} logged</Text>
            </View>
          ) : (
            <View style={styles.patternsContentSurface}>
              <Text style={styles.patternsContextLine}>
                Based on your {logs.length} logged urge{logs.length !== 1 ? 's' : ''}.
              </Text>

              <Text style={styles.patternsSubsectionTitle}>When do urges hit hardest?</Text>
              {peakSlotIndex >= 0 && (
                <View style={styles.peakTimeChip}>
                  <Text style={styles.peakTimeChipText}>
                    Peak: {TIME_GROUPS[peakSlotIndex].emoji} {TIME_GROUPS[peakSlotIndex].label}
                  </Text>
                </View>
              )}
              <View style={styles.patternsInnerCard}>
                <View style={styles.chart}>
                  {TIME_GROUPS.map((group, i) => {
                    const count = timeGroupCounts[i];
                    const isPeak = i === peakSlotIndex && count > 0;
                    const barHeight = Math.max(6, (count / maxGroupCount) * 88);
                    return (
                      <View key={group.label} style={styles.chartBar}>
                        <Text style={[styles.chartBarCount, isPeak && styles.chartBarCountPeak]}>
                          {count > 0 ? count : '—'}
                        </Text>
                        <View style={styles.chartBarTrackOuter}>
                          <LinearGradient
                            colors={
                              isPeak
                                ? ['#03045e', '#020338']
                                : ['rgba(3,4,94,0.42)', 'rgba(3,4,94,0.12)']
                            }
                            locations={[0, 1]}
                            style={[styles.chartBarGradient, { height: barHeight }]}
                          />
                        </View>
                        <View style={[styles.chartEmojiWrap, isPeak && styles.chartEmojiWrapPeak]}>
                          <Text style={styles.chartBarEmoji}>{group.emoji}</Text>
                        </View>
                        <Text style={[styles.chartBarLabel, isPeak && styles.chartBarLabelPeak]}>
                          {group.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {topTrigger && (
                <>
                  <View style={styles.patternsPanelDivider} />
                  <Text style={styles.patternsSubsectionTitle}>Shows up most often</Text>
                  <View style={styles.patternsTriggerCard}>
                    <View style={styles.patternsTriggerIconCircle}>
                      <Zap size={20} color="#03045e" />
                    </View>
                    <View style={styles.patternsTriggerCopy}>
                      <Text style={styles.patternsTriggerValue}>{topTrigger}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Logs List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          <Text style={styles.sectionSubtitle}>
            Every urge you log is data that helps you drink less.
          </Text>
          
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No logs yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start by logging your first urge to track your journey
              </Text>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logTimestamp}>
                    <Clock size={16} color="#8E8E93" />
                    <Text style={styles.timestampText}>{formatDate(log.timestamp)}</Text>
                  </View>
                  <View style={styles.logActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleEditLog(log)}>
                      <Pencil size={16} color="#03045e" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteLog(log)}>
                      <Trash2 size={16} color="#FF6B47" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.logContent}>
                  <View style={styles.intensitySection}>
                    <Text style={styles.logLabel}>Intensity</Text>
                    <View style={styles.logIntensityDisplay}>
                      <Text style={styles.logIntensityEmoji}>{getEmojiForIntensity(log.intensity)}</Text>
                      <Text style={styles.logIntensityText}>Level {log.intensity}</Text>
                    </View>
                  </View>

                  <View style={styles.logField}>
                    <Text style={styles.logLabel}>Trigger</Text>
                    <Text style={styles.logValue}>{log.trigger}</Text>
                  </View>

                  <View style={styles.logField}>
                    <Text style={styles.logLabel}>How I dealt with it</Text>
                    <Text style={styles.logValue}>{log.coping_strategy}</Text>
                  </View>

                  {log.notes && (
                    <View style={styles.logField}>
                      <Text style={styles.logLabel}>Notes</Text>
                      <Text style={styles.logValue}>{log.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <LogModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveLog}
        onUpdate={handleUpdateLog}
        editingLog={editingLog}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B47',
    marginBottom: 8,
  },
  errorSubtext: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 90,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 22,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(3, 4, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconCircleWarm: {
    backgroundColor: 'rgba(255, 107, 71, 0.08)',
  },
  statDividerVert: {
    width: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 6,
  },
  statNumberPremium: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabelCaps: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  logButtonWrap: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  addButton: {
    backgroundColor: '#03045e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#03045e',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  addButtonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 250,
  },
  logCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  logActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    gap: 12,
  },
  intensitySection: {
    marginBottom: 4,
  },
  logField: {
    marginBottom: 4,
  },
  logLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  logValue: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  logIntensityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  logIntensityEmoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    marginRight: 8,
  },
  logIntensityText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
  },

  // --- Craving patterns (aligned with Home Daily Check-in) ---
  patternsHeaderBlock: {
    marginBottom: 14,
  },
  patternsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternsTitleCluster: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  patternsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patternsSectionTitle: {
    marginBottom: 0,
    flex: 1,
  },
  patternsSubtitleLines: {
    marginTop: 6,
    paddingLeft: 28,
    paddingRight: 8,
    gap: 4,
  },
  patternsSubtitleLine: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 19,
    fontWeight: '500',
  
},
  patternsBadgeCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  patternsStreakPill: {
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.14)',
  },
  patternsStreakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  patternsStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  patternsStreakCount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.45,
    lineHeight: 19,
  
},
  patternsStreakSlash: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  
},
  patternsStreakCaptionInline: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#03045e',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.05,
  
},
  patternsLockedSurface: {
    alignItems: 'center',
    backgroundColor: 'rgba(3, 4, 94, 0.055)',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
  },
  patternsLockIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(3, 4, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.18)',
  },
  patternsLockedTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.35,
    maxWidth: 300,
  
},
  patternsLockedSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: 22,
    fontWeight: '500',
  
},
  lockedDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  lockedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E5EA',
  },
  lockedDotFilled: {
    backgroundColor: '#03045e',
  },
  lockedProgress: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  
},
  patternsContentSurface: {
    backgroundColor: 'rgba(3, 4, 94, 0.055)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
  },
  patternsContextLine: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#636366',
    fontWeight: '500',
    marginBottom: 18,
    lineHeight: 19,
  
},
  patternsSubsectionTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: -0.3,
  
},
  patternsInnerCard: {
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 12,
  },
  patternsPanelDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 18,
  },
  peakTimeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.2)',
  },
  peakTimeChipText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#03045e',
    letterSpacing: -0.1,
  
},
  patternsTriggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EBEBED',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  patternsTriggerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(3, 4, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternsTriggerCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  patternsTriggerValue: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.35,
    lineHeight: 22,
  
},
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 0,
    gap: 4,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 88,
  },
  chartBarTrackOuter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 96,
    marginBottom: 10,
    backgroundColor: '#E8EAED',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  chartBarGradient: {
    width: '78%',
    maxWidth: 22,
    borderRadius: 8,
    minHeight: 4,
  },
  chartEmojiWrap: {
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chartEmojiWrapPeak: {
    borderColor: 'rgba(3, 4, 94, 0.45)',
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
  },
  chartBarEmoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 17,
  
},
  chartBarLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  
},
  chartBarLabelPeak: {
    fontFamily: FONT_FAMILY_UI,
    color: '#03045e',
    fontWeight: '700',
  
},
  chartBarCount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    fontWeight: '600',
    color: '#AEAEB2',
    marginBottom: 6,
    height: 18,
  
},
  chartBarCountPeak: {
    fontFamily: FONT_FAMILY_UI,
    color: '#03045e',
    fontWeight: '700',
  
},

  bottomSpacing: {
    height: 100,
  },
});