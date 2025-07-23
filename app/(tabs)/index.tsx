import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { DollarSign, Heart, Target, Check, Trophy, Crosshair, TrendingUp, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import { useQuitTimer } from '@/hooks/useQuitTimer';
import { useMoneySaved } from '@/hooks/useMoneySaved';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { useQuitMotivation } from '@/hooks/useQuitMotivation';
import { useHealthRecovery } from '@/hooks/useHealthRecovery';
import { format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const { days, hours, minutes, quitDate, loading: timerLoading, error: timerError } = useQuitTimer();
  const { totalSaved, dailyRate, hourlyRate, currency, loading: savingsLoading, error: savingsError } = useMoneySaved();
  const { financialGoal, loading: goalLoading, error: goalError, getCurrencySymbol } = useFinancialGoals();
  const { motivation, loading: motivationLoading, error: motivationError } = useQuitMotivation();
  const { milestones: healthMilestones, loading: healthLoading, error: healthError } = useHealthRecovery();

  // Show loading state if any data is loading
  if (timerLoading || savingsLoading || goalLoading || motivationLoading || healthLoading) {
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

  // Show error state or fallback for timer
  const displayDays = timerError ? 0 : days;
  const displayHours = timerError ? 0 : hours;
  const displayMinutes = timerError ? 0 : minutes;
  const displayText = timerError ? 'Complete onboarding to start tracking' : 'days strong';

  // Show error state or fallback for savings
  const displayTotalSaved = savingsError ? 0 : totalSaved;
  const displayDailyRate = savingsError ? 0 : dailyRate;
  const displayHourlyRate = savingsError ? 0 : hourlyRate;
  const displayCurrency = currency || '$';

  // Format money without decimals for the main display
  const formatMoney = (amount: number): string => {
    return Math.floor(amount).toLocaleString();
  };

  // Format money with decimals for detailed views
  const formatMoneyDetailed = (amount: number): string => {
    return amount.toFixed(2);
  };

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
            {timerError 
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
              <Text style={styles.statValue}>{displayCurrency}{formatMoney(displayTotalSaved)}</Text>
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
          <Text style={styles.moneyAmount}>{displayCurrency}{formatMoneyDetailed(displayTotalSaved)}</Text>
          
          <View style={styles.ratesContainer}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Daily rate:</Text>
              <Text style={styles.rateValue}>{displayCurrency}{formatMoneyDetailed(displayDailyRate)}</Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Hourly rate:</Text>
              <Text style={styles.rateValue}>{displayCurrency}{formatMoneyDetailed(displayHourlyRate)}</Text>
            </View>
          </View>

          <View style={styles.motivationBanner}>
            <Text style={styles.motivationEmoji}>💰</Text>
            <Text style={styles.motivationText}>
              {savingsError 
                ? 'Complete onboarding to track savings!' 
                : displayTotalSaved > 0 
                  ? 'Every minute counts! Keep it up!' 
                  : 'Your savings will start growing once you quit!'
              }
            </Text>
          </View>
        </View>

        {/* Financial Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Financial Goals</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your savings goals</Text>
          
          {goalError || !financialGoal ? (
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>
                  {goalError ? 'Complete onboarding to set goals' : 'No financial goal set'}
                </Text>
                <Text style={styles.goalAmount}>--</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '0%' }]} />
                </View>
                <Text style={styles.progressPercent}>0%</Text>
              </View>
            </View>
          ) : (
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{financialGoal.description}</Text>
                <Text style={styles.goalAmount}>
                  {getCurrencySymbol(financialGoal.currency)}{financialGoal.amount.toFixed(0)}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((displayTotalSaved / financialGoal.amount) * 100, 100)}%` 
                  }]} />
                </View>
                <Text style={styles.progressPercent}>
                  {Math.min((displayTotalSaved / financialGoal.amount) * 100, 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/goals')}
          >
            <Text style={styles.viewAllText}>View All Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Remember Your Why Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Remember Your Why</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your personal motivation</Text>
          
          {motivationError || !motivation ? (
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationText}>
                {motivationError ? 'Complete onboarding to see your motivation' : 'No motivation set yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.motivationContainer}>
              {/* Custom Quit Reason */}
              <View style={styles.customReasonContainer}>
                <Text style={styles.customReasonTitle}>Your Personal Why</Text>
                <Text style={styles.customReasonText}>"{motivation.quitReason}"</Text>
              </View>

              {/* Personal Goals */}
              {motivation.personalGoals.length > 0 && (
                <View style={styles.goalsContainer}>
                  <Text style={styles.goalsTitle}>Your Goals</Text>
                  <View style={styles.goalsList}>
                    {motivation.personalGoals.map((goal, index) => (
                      <View key={index} style={styles.goalTag}>
                        <Text style={styles.goalTagText}>{goal}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Quit Reasons */}
              {motivation.quitReasons.length > 0 && (
                <View style={styles.reasonsContainer}>
                  <Text style={styles.reasonsTitle}>Your Reasons</Text>
                  <View style={styles.reasonsList}>
                    {motivation.quitReasons.map((reason, index) => (
                      <View key={index} style={styles.reasonItem}>
                        <Text style={styles.reasonText}>• {reason}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Health Recovery Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Health Recovery Timeline</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Based on WHO medical research</Text>
          
          {healthError ? (
            <View style={styles.timelineContainer}>
              <Text style={styles.timelineDescription}>
                Complete onboarding to see your health recovery progress
              </Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {healthMilestones.map((milestone, index) => (
                <View key={milestone.id} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View style={[
                      styles.timelineIcon,
                      !milestone.achieved && styles.timelineIconInactive
                    ]}>
                      {milestone.iconType === 'heart' ? (
                        <Heart 
                          size={16} 
                          color={milestone.achieved ? (milestone.iconColor || '#FF69B4') : '#8E8E93'} 
                        />
                      ) : (
                        <Text style={[
                          styles.timelineEmoji,
                          !milestone.achieved && styles.timelineEmojiInactive
                        ]}>
                          {milestone.icon}
                        </Text>
                      )}
                    </View>
                    {index < healthMilestones.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        !milestone.achieved && styles.timelineLineInactive
                      ]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={[
                        styles.timelineTime,
                        !milestone.achieved && styles.timelineTimeInactive
                      ]}>
                        {milestone.timeDisplay}
                      </Text>
                      {milestone.achieved ? (
                        <View style={styles.checkmark}>
                          <Check size={16} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.checkmarkInactive} />
                      )}
                    </View>
                    <Text style={[
                      styles.timelineTitle,
                      !milestone.achieved && styles.timelineTitleInactive
                    ]}>
                      {milestone.title}
                    </Text>
                    <Text style={[
                      styles.timelineDescription,
                      !milestone.achieved && styles.timelineDescriptionInactive
                    ]}>
                      {milestone.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
      height: 12,
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
  // Inactive timeline styles
  timelineIconInactive: {
    borderColor: '#E5E5EA',
  },
  timelineEmojiInactive: {
    opacity: 0.4,
  },
  timelineLineInactive: {
    backgroundColor: '#E5E5EA',
  },
  timelineTimeInactive: {
    color: '#C7C7CC',
  },
  checkmarkInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  timelineTitleInactive: {
    color: '#C7C7CC',
  },
  timelineDescriptionInactive: {
    color: '#C7C7CC',
  },
  // Remember Your Why section styles
  motivationContainer: {
    marginTop: 0,
  },
  customReasonContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  customReasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  customReasonText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  goalsContainer: {
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  goalsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    backgroundColor: '#35998d',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  reasonsContainer: {
    marginBottom: 8,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    paddingVertical: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
});