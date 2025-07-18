import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CreditCard as Edit, Trash2, Clock, TrendingDown, Star, Settings } from 'lucide-react-native';

export default function LogsScreen() {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 2) return '#35998d';
    if (intensity <= 3) return '#FF9500';
    return '#FF6B47';
  };

  const getEmojiForIntensity = (intensity: number) => {
    switch (intensity) {
      case 1: return '😊';
      case 2: return '😐';
      case 3: return '😟';
      case 4: return '😠';
      case 5: return '😡';
      default: return '😐';
    }
  };

  const renderStars = (intensity: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <TouchableOpacity key={star}>
            <Star
              size={20}
              color={star <= intensity ? getIntensityColor(intensity) : '#E5E5EA'}
              fill={star <= intensity ? getIntensityColor(intensity) : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmojiRating = (intensity: number) => {
    return (
      <View style={styles.emojiContainer}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.emojiButton,
              intensity === rating && styles.emojiButtonSelected
            ]}
          >
            <Text style={styles.emojiText}>{getEmojiForIntensity(rating)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Static sample data
  const logs = [
    {
      id: '1',
      timestamp: new Date(2025, 0, 15, 14, 30),
      intensity: 7,
      trigger: 'Stress at work',
      howDealt: 'Used box breathing exercise',
      notes: 'Felt much better after 5 minutes'
    },
    {
      id: '2',
      timestamp: new Date(2025, 0, 14, 9, 15),
      intensity: 4,
      trigger: 'Coffee break',
      howDealt: 'Went for a walk instead',
      notes: 'Fresh air helped a lot'
    },
    {
      id: '3',
      timestamp: new Date(2025, 0, 13, 20, 45),
      intensity: 8,
      trigger: 'Social situation',
      howDealt: 'Called my support person',
      notes: 'Talking it through really helped'
    }
  ];

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
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
          <View style={styles.statBox}>
            <TrendingDown size={24} color="#FF6B47" />
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Avg Intensity</Text>
          </View>
          <View style={styles.statBox}>
            <Star size={24} color="#35998d" />
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Low Intensity</Text>
          </View>
        </View>

        {/* Add New Log Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Log New Craving</Text>
          </TouchableOpacity>
        </View>

        {/* Logs List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          <Text style={styles.sectionSubtitle}>Track your cravings and how you handled them.</Text>
          
          {logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logTimestamp}>
                  <Clock size={16} color="#8E8E93" />
                  <Text style={styles.timestampText}>{formatDate(log.timestamp)}</Text>
                </View>
                <View style={styles.logActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Edit size={16} color="#35998d" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
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
                  <Text style={styles.logValue}>{log.howDealt}</Text>
                </View>

                {log.notes && (
                  <View style={styles.logField}>
                    <Text style={styles.logLabel}>Notes</Text>
                    <Text style={styles.logValue}>{log.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonSelected: {
    borderColor: '#35998d',
    backgroundColor: '#E8F5E8',
  },
  emojiText: {
    fontSize: 24,
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