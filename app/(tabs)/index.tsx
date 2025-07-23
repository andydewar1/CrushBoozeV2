import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { DollarSign, Heart, Target, Check, Trophy, Crosshair, TrendingUp } from 'lucide-react-native';
import Header from '../../components/Header';
import { useQuitTimer } from '@/hooks/useQuitTimer';
import { format } from 'date-fns';

export default function HomeScreen() {
  const { days, hours, minutes, quitDate, loading, error } = useQuitTimer();

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Header 
            title="Home" 
            subtitle="Your future self is proud of you."
          />
          <View style={styles.progressCard}>
            <View style={styles.circularProgress}>
              <View style={styles.progressRing}>
                <View style={styles.progressContent}>
                  <Text style={styles.daysNumber}>...</Text>
                  <Text style={styles.daysText}>loading</Text>
                  <Text style={styles.timeText}>...</Text>
                </View>
              </View>
            </View>
            <Text style={styles.sinceText}>Loading your progress...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show error state or fallback
  const displayDays = error ? 0 : days;
  const displayHours = error ? 0 : hours;
  const displayMinutes = error ? 0 : minutes;
  const displayText = error ? 'Complete onboarding to start tracking' : 'days strong';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header 
          title="Home" 
          subtitle="Your future self is proud of you."
        />

        {/* Main Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.circularProgress}>
            <View style={styles.progressRing}>
              <View style={styles.progressContent}>
                <Text style={styles.daysNumber}>{displayDays}</Text>
                <Text style={styles.daysText}>{displayText}</Text>
                <Text style={styles.timeText}>{displayHours}h {displayMinutes}m</Text>
              </View>
            </View>
          </View>
          <Text style={styles.sinceText}>
            {error 
              ? 'Set up your quit date in settings' 
              : quitDate 
                ? `Since ${format(quitDate, 'MMMM d, yyyy')}` 
                : 'Since you quit'
            }
          </Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>$1074</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🫁</Text>
              <Text style={styles.statValue}>30%</Text>
              <Text style={styles.statLabel}>Lung Recovery</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>❤️</Text>
              <Text style={styles.statValue}>30%</Text>
              <Text style={styles.statLabel}>Circulation</Text>
            </View>
          </View>
        </View>

        {/* Money Saved Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Money Saved</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Total savings so far</Text>
          <Text style={styles.moneyAmount}>$1074.04</Text>
          
          <View style={styles.ratesContainer}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Daily rate:</Text>
              <Text style={styles.rateValue}>$16.00</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Hourly rate:</Text>
              <Text style={styles.rateValue}>$0.67</Text>
            </View>
          </View>

          <View style={styles.motivationBanner}>
            <Text style={styles.motivationEmoji}>💰</Text>
            <Text style={styles.motivationText}>Every hour counts! Keep it up!</Text>
          </View>
        </View>

        {/* Financial Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Financial Goals</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your savings goals</Text>
          
          <View style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>Holiday to Dubai</Text>
              <Text style={styles.goalAmount}>$2000</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '54%' }]} />
              </View>
              <Text style={styles.progressPercent}>54%</Text>
            </View>
          </View>

          <View style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Goals</Text>
          </View>
        </View>

        {/* Health Recovery Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Health Recovery Timeline</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Based on WHO medical research</Text>
          
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineIcon}>
                  <Heart size={16} color="#FF69B4" />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>20 MINUTES</Text>
                  <View style={styles.checkmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.timelineTitle}>Heart rate normalizes</Text>
                <Text style={styles.timelineDescription}>
                  Heart rate and blood pressure drop to normal levels
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineIcon}>
                  <Text style={styles.timelineEmoji}>🫁</Text>
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>12 HOURS</Text>
                  <View style={styles.checkmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.timelineTitle}>Carbon monoxide clears</Text>
                <Text style={styles.timelineDescription}>
                  Carbon monoxide level in blood normalizes, oxygen levels increase
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineIcon}>
                  <Heart size={16} color="#FF4757" />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>1 DAY</Text>
                  <View style={styles.checkmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.timelineTitle}>Heart attack risk drops</Text>
                <Text style={styles.timelineDescription}>
                  Risk of heart attack begins to decrease
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineIcon}>
                  <Text style={styles.timelineEmoji}>🔔</Text>
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>2 DAYS</Text>
                  <View style={styles.checkmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.timelineTitle}>Nerve endings regrow</Text>
                <Text style={styles.timelineDescription}>
                  Damaged nerve endings start to regrow, taste and smell improve
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineIcon}>
                  <Text style={styles.timelineEmoji}>🧠</Text>
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>3 DAYS</Text>
                  <View style={styles.checkmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.timelineTitle}>Nicotine withdrawal peaks</Text>
                <Text style={styles.timelineDescription}>
                  Nicotine is completely out of your system, lung capacity increases
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineIcon}>
                  <Text style={styles.timelineEmoji}>🩸</Text>
                </View>
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>1 WEEK</Text>
                  <View style={styles.checkmark}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.timelineTitle}>Circulation improves</Text>
                <Text style={styles.timelineDescription}>
                  Blood circulation improves significantly
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Achievement Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crosshair size={20} color="#FF6B47" />
            <Text style={styles.sectionTitle}>Next Achievement</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your next milestone is within reach.</Text>
          
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementName}>3 Month Titan</Text>
            <Text style={styles.achievementDescription}>Heart attack risk dropping</Text>
          </View>
          
          <View style={styles.achievementProgressContainer}>
            <View style={styles.daysToGoBox}>
              <Text style={styles.daysToGoNumber}>23</Text>
              <Text style={styles.daysToGoLabel}>Days to go</Text>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercentage}>75%</Text>
              </View>
              <View style={styles.achievementProgressBar}>
                <View style={[styles.achievementProgressFill, { width: '75%' }]} />
              </View>
            </View>
          </View>
          
          <View style={styles.motivationBanner}>
            <Text style={styles.motivationEmoji}>🎯</Text>
            <Text style={styles.motivationText}>You're 75% there! Keep going strong!</Text>
          </View>
        </View>
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
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  progressCard: {
    backgroundColor: '#35998D',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#35998D',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  sinceText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 12,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
  },
  moneyAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#35998D',
    marginBottom: 20,
  },
  ratesContainer: {
    marginBottom: 20,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rateLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35998d',
  },
  motivationBanner: {
    backgroundColor: 'rgba(53, 153, 141, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.2)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  motivationText: {
    fontSize: 16,
    color: '#35998d',
    fontWeight: '500',
  },
  achievementInfo: {
    marginBottom: 20,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  achievementProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  daysToGoBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#35998d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  daysToGoNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#35998d',
    marginBottom: 4,
  },
  daysToGoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  progressSection: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35998d',
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#35998d',
    borderRadius: 4,
  },
  goalItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  goalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35998d',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#35998d',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#35998d',
  },
  viewAllButton: {
    backgroundColor: '#35998d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#35998d',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    transform: [{ scale: 1 }],
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timelineContainer: {
    marginTop: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#35998d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineEmoji: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#35998d',
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#35998d',
    letterSpacing: 0.5,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#35998d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});