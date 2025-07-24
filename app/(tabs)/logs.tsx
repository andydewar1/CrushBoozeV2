import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2, Clock, TrendingDown, Star, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { useCravingLogs, CravingLog } from '@/hooks/useCravingLogs';
import LogModal from '@/components/LogModal';

export default function LogsScreen() {
  const { logs, stats, loading, error, addCravingLog, updateCravingLog, deleteCravingLog } = useCravingLogs();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<CravingLog | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return '#35998d';    // Green for low
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
      'Are you sure you want to delete this craving log?',
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
          <ActivityIndicator size="large" color="#35998d" />
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
            <Text style={styles.pageSubtitle}>Your journey in your own words.</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Clock size={24} color="#35998d" />
            <Text style={styles.statNumber}>{stats.totalLogs}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
          <View style={styles.statBox}>
            <TrendingDown size={24} color="#FF6B47" />
            <Text style={styles.statNumber}>{stats.averageIntensity.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Intensity</Text>
          </View>
          <View style={styles.statBox}>
            <Star size={24} color="#FF6B47" />
            <Text style={styles.statNumber}>{stats.highIntensityCount}</Text>
            <Text style={styles.statLabel}>High Intensity</Text>
          </View>
        </View>

        {/* Add New Log Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddLog}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Log New Craving</Text>
          </TouchableOpacity>
        </View>

        {/* Logs List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          <Text style={styles.sectionSubtitle}>Track your cravings and how you handled them.</Text>
          
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No logs yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start by logging your first craving to track your journey
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
                      <Pencil size={16} color="#35998d" />
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B47',
    marginBottom: 8,
  },
  errorSubtext: {
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
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(53, 153, 141, 0.08)',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
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
    backgroundColor: '#35998d',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#35998d',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  logValue: {
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
    fontSize: 20,
    marginRight: 8,
  },
  logIntensityText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  bottomSpacing: {
    height: 100,
  },
});