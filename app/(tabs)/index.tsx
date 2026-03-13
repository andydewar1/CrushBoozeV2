import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { DollarSign, Heart, Target, Check, Trophy, Crosshair, TrendingUp, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import Header from '../../components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useQuitTimer } from '@/hooks/useQuitTimer';
import { useMoneySaved } from '@/hooks/useMoneySaved';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { useGoals, type Goal } from '@/hooks/useGoals';
import { useQuitMotivation } from '@/hooks/useQuitMotivation';
import { useHealthRecovery } from '@/hooks/useHealthRecovery';
import { useAchievements } from '@/hooks/useAchievements';
import { useSettings } from '@/contexts/SettingsContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RevenueCatService from '@/services/RevenueCatService';
import { format } from 'date-fns';
import { initializeFacebookSDK, logAppInstall } from '@/lib/facebook';


export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { settings } = useSettings();
  const { days, hours, minutes, quitDate, loading: timerLoading, error: timerError } = useQuitTimer();
  const { totalSaved, dailyRate, hourlyRate, weeklyRate, currency, loading: savingsLoading, error: savingsError } = useMoneySaved();
  const { financialGoal, loading: goalLoading, error: goalError, getCurrencySymbol } = useFinancialGoals();
  const { activeGoals, achievedGoals, calculateGoalProgress, refetch: refetchGoals } = useGoals();
  const { motivation, loading: motivationLoading, error: motivationError } = useQuitMotivation();
  const { milestones: healthMilestones, loading: healthLoading, error: healthError } = useHealthRecovery();
  const { stats: achievementStats, loading: achievementsLoading, error: achievementsError } = useAchievements();

  // Calculate total committed to achieved goals and available savings
  const totalCommitted = achievedGoals.reduce(
    (sum, g) => sum + g.target_amount,
    0
  );
  const availableSavings = Math.max(totalSaved - totalCommitted, 0);

  const getGoalProgress = (goal: Goal) => {
    if (goal.achieved_at) return 100;

    const progressAmount = Math.min(availableSavings, goal.target_amount);
    return Math.round((progressAmount / goal.target_amount) * 100);
  };

  const getRemainingForGoal = (goal: Goal) => {
    if (goal.achieved_at) return 0;

    const progressAmount = Math.min(availableSavings, goal.target_amount);
    return Math.max(goal.target_amount - progressAmount, 0);
  };

  // Initialize Facebook SDK once on mount
  useEffect(() => {
    const initFacebook = async () => {
      await initializeFacebookSDK();
      logAppInstall();
    };
    initFacebook();
  }, []);

  // Request permission on Home screen (first time only)
  useEffect(() => {
    (async () => {
      try {
        const key = 'notifications_prompted_v1';
        const already = await AsyncStorage.getItem(key);
        
        if (already) {
          console.log('[Home] ℹ️ Notification permission already prompted');
          return;
        }

        console.log('[Home] 🔔 Requesting notification permission for the first time...');
        const { status } = await Notifications.requestPermissionsAsync();
        await AsyncStorage.setItem(key, '1');
        console.log('[Home] 📋 Permission result:', status);

        if (status === 'granted') {
          console.log('[Home] ✅ Permission granted! Scheduling daily 12pm notification...');
          // THIS IS THE CRITICAL FIX: Schedule notification after permission is granted
          const { scheduleProgressNotifications } = await import('@/contexts/NotificationContext');
          await scheduleProgressNotifications();
        } else {
          console.log('[Home] 🔕 User declined notifications');
        }
      } catch (e) {
        console.log('[Home] ❌ Permission flow error:', e);
      }
    })();
  }, []);

  // Request ATT permission after user has seen the app (better UX)
  useEffect(() => {
    (async () => {
      try {
        const key = 'att_prompted_v1';
        const already = await AsyncStorage.getItem(key);
        if (already) return;

        // Wait 2 seconds so user sees the app first
        setTimeout(async () => {
          const { requestTrackingPermission } = await import('@/lib/facebook');
          await requestTrackingPermission();
          await AsyncStorage.setItem(key, '1');
        }, 2000);
      } catch (e) {
        console.log('[Home] ⚠️ ATT permission error', e);
      }
    })();
  }, []);


  // Refresh goals when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchGoals();
    }, [refetchGoals])
  );

  // Show loading state if any data is loading - temporarily disabled
  // if (timerLoading || savingsLoading || goalLoading || motivationLoading || healthLoading || achievementsLoading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
  //         <Header 
  //           title="Home" 
  //           subtitle="Your future self is proud of you."
  //         />
  //         <View style={styles.progressCard}>
  //           <View style={styles.circularProgress}>
  //             <View style={styles.progressRing}>
  //               <View style={styles.progressContent}>
  //                 <Text style={styles.daysNumber}>...</Text>
  //                 <Text style={styles.daysText}>loading</Text>
  //                 <Text style={styles.timeText}>...</Text>
  //               </View>
  //             </View>
  //           </View>
  //           <Text style={styles.sinceText}>Loading your progress...</Text>
  //         </View>
  //       </ScrollView>
  //     </SafeAreaView>
  //   );
  // }

  // Show loading or error state for timer
  const displayDays = (timerLoading || (timerError && timerError !== 'future_quit_date')) ? 0 : days;
  const displayHours = (timerLoading || (timerError && timerError !== 'future_quit_date')) ? 0 : hours;
  const displayMinutes = (timerLoading || (timerError && timerError !== 'future_quit_date')) ? 0 : minutes;
  const displayText = timerLoading ? 'Loading...' 
    : timerError 
      ? timerError === 'future_quit_date'
        ? 'days until quit'
        : 'days'
      : 'days sober';

  // Show loading or error state for savings
  const displayTotalSaved = (savingsLoading || savingsError) ? 0 : totalSaved;
  const displayWeeklyRate = (savingsLoading || savingsError) ? 0 : weeklyRate;
  const displayDailyRate = (savingsLoading || savingsError) ? 0 : dailyRate;
  const displayHourlyRate = (savingsLoading || savingsError) ? 0 : hourlyRate;
  const displayCurrency = currency || '$';

  // Format money without decimals for the main display
  const formatMoney = (amount: number): string => {
    return Math.floor(amount).toLocaleString();
  };

  // Format money compactly for small stat boxes
  const formatMoneyCompact = (amount: number): string => {
    // For amounts >= 1000, use K format with capital K
    if (amount >= 1000) {
      const kValue = amount / 1000;
      // Show 1 decimal place if it's not a whole number
      return kValue % 1 === 0 ? `${Math.floor(kValue)}K` : `${kValue.toFixed(1)}K`;
    }
    // For smaller amounts, show whole number
    return Math.floor(amount).toString();
  };

  // Format money with decimals for detailed views - handle large amounts
  const formatMoneyDetailed = (amount: number): string => {
    // For very large amounts (>$100K), show in K format
    if (amount >= 100000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    // For amounts >$10K, show without decimals to save space
    if (amount >= 10000) {
      return Math.floor(amount).toLocaleString();
    }
    // For smaller amounts, show with decimals
    return amount.toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#03045e';
    if (progress >= 75) return '#03045e';
    if (progress >= 50) return '#FF9500';
    return '#FF6B47';
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header 
          title={`Hey, ${settings?.name || 'there'}.`}
          subtitle="Keep up the good work!"
        />

        {/* Main Progress Card */}
        {/* Main Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.circularProgress}>
            <View style={styles.progressRing}>
              <View style={styles.progressContent}>
                <Text style={[
                  styles.daysNumber,
                  // Reduce font size for very large day counts (4+ digits)
                  displayDays >= 1000 && styles.daysNumberLarge
                ]}>
                  {displayDays}
                </Text>
                <Text style={styles.daysText}>{displayText}</Text>
                {!timerError || timerError === 'future_quit_date' ? (
                  <Text style={styles.timeText}>{displayHours}h {displayMinutes}m</Text>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={styles.sinceText}>
            {timerError && timerError !== 'future_quit_date'
              ? 'Add your quit and habit data in settings to see your results' 
              : quitDate 
                ? `Since ${format(quitDate, 'MMMM d, yyyy')}` 
                : 'Since you quit'
            }
          </Text>
        </View>

        {/* Money Saved Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Money Saved</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Total savings so far</Text>
          <Text style={[
            styles.moneyAmount,
            // Reduce font size for very large amounts
            displayTotalSaved >= 100000 && styles.moneyAmountLarge
          ]}>
            {displayCurrency}{formatMoneyDetailed(displayTotalSaved)}
          </Text>
          
          <View style={styles.ratesContainer}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Weekly rate:</Text>
              <Text style={styles.rateValue}>{displayCurrency}{formatMoneyDetailed(displayWeeklyRate)}</Text>
            </View>
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
                ? savingsError === 'future_quit_date'
                  ? quitDate 
                    ? `Savings begin on ${format(quitDate, 'MMMM d, yyyy')}!`
                    : 'Savings will start when you quit!'
                  : 'Add your quit and habit data in settings to see your results' 
                : displayTotalSaved > 0 
                  ? 'Every minute counts!' 
                  : 'Your savings will start growing once you quit!'
              }
            </Text>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your progress milestones</Text>
          
          {achievementsLoading ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>Loading...</Text>
              <Text style={styles.achievementDescription}>Please wait</Text>
            </View>
          ) : achievementsError ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>
                {achievementsError === 'future_quit_date' 
                  ? 'Achievements coming soon' 
                  : 'Add your quit and habit data in settings to see your results'
                }
              </Text>
              <Text style={styles.achievementDescription}>
                {achievementsError === 'future_quit_date'
                  ? quitDate 
                    ? `Your journey begins ${format(quitDate, 'MMMM d, yyyy')}`
                    : 'Your achievements will unlock when you quit'
                  : 'Track your progress and earn badges for milestones'
                }
              </Text>
            </View>
          ) : (
            <>
              {/* Current Achievement */}
              {achievementStats.currentAchievement && (
                <>
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementContainer}>
                      <Text style={styles.achievementBadge}>{achievementStats.currentAchievement.emoji}</Text>
                      <View style={styles.achievementText}>
                        <Text style={styles.achievementName}>{achievementStats.currentAchievement.title}</Text>
                        <Text style={styles.achievementDescription}>{achievementStats.currentAchievement.description}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.celebrationBanner}>
                    <Text style={styles.celebrationEmoji}>🎉</Text>
                    <Text style={styles.celebrationText}>
                      Congratulations! You've achieved {achievementStats.currentAchievement.title}!
                    </Text>
                  </View>
                </>
              )}

              {/* Upcoming Achievement */}
              {achievementStats.nextAchievement ? (
                <>
                  <View style={styles.upcomingSection}>
                    <Text style={styles.upcomingTitle}>Upcoming Achievement</Text>
                    
                    <View style={styles.achievementProgressContainer}>
                      <View style={styles.daysToGoBox}>
                        <Text style={styles.daysToGoNumber}>{achievementStats.daysToNext}</Text>
                        <Text style={styles.daysToGoLabel}>Days to go</Text>
                      </View>
                      
                      <View style={styles.progressSection}>
                        <Text style={styles.upcomingAchievementName}>{achievementStats.nextAchievement.title}</Text>
                        <Text style={styles.upcomingAchievementDescription}>{achievementStats.nextAchievement.description}</Text>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>Progress</Text>
                          <Text style={styles.progressPercentage}>{achievementStats.progressToNext}%</Text>
                        </View>
                        <View style={styles.achievementProgressBar}>
                          <View style={[styles.achievementProgressFill, { width: `${achievementStats.progressToNext}%` }]} />
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.motivationBanner}>
                      <Text style={styles.motivationEmoji}>🎯</Text>
                      <Text style={styles.motivationText}>
                        {achievementStats.progressToNext >= 75 
                          ? `You're ${achievementStats.progressToNext}% there! Keep going strong!`
                          : achievementStats.progressToNext >= 50
                          ? `Halfway there! ${achievementStats.daysToNext} days to go!`
                          : `Every day counts! ${achievementStats.daysToNext} days to your next milestone!`
                        }
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>All achievements unlocked!</Text>
                  <Text style={styles.achievementDescription}>Congratulations on your journey!</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Financial Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Financial Goals</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your savings goals</Text>
          
          {activeGoals.length === 0 ? (
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>
                    {goalError ? 'Add your quit and habit data in settings to see your results' : 'No financial goals set'}
                  </Text>
                  <Text style={styles.goalTarget}>--</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.goalProgressPercentage}>0%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '0%' }]} />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            activeGoals.slice(0, 2).map((goal) => {
              const progress = getGoalProgress(goal);
              const remaining = getRemainingForGoal(goal);
              
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalTarget}>{formatCurrency(goal.target_amount)}</Text>
                    </View>
                  </View>

                  {goal.description && (
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  )}

                  <View style={styles.progressContainer}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.goalProgressPercentage}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View style={[
                          styles.progressFill, 
                          { 
                            width: `${progress}%`,
                            backgroundColor: getProgressColor(progress)
                          }
                        ]} />
                      </View>
                    </View>
                    {remaining > 0 && progress < 100 && (
                      <Text style={styles.remainingText}>
                        {formatCurrency(remaining)} to go
                      </Text>
                    )}
                    {progress >= 100 && (
                      <View style={styles.achievedBanner}>
                        <Text style={styles.achievedEmoji}>🎯</Text>
                        <Text style={styles.achievedText}>Ready to mark complete!</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/goals')}
          >
            <Text style={styles.viewAllText}>{activeGoals.length > 2 ? `View All ${activeGoals.length} Goals` : 'View All Goals'}</Text>
          </TouchableOpacity>
        </View>

        {/* Remember Your Why Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Remember Your Why</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your personal motivation</Text>
          
          {motivationError || !motivation ? (
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationText}>
                {motivationError ? 'Add your quit and habit data in settings to see your results' : 'No motivation set yet'}
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
                        <Text style={styles.goalTagText}>{goal.charAt(0).toUpperCase() + goal.slice(1)}</Text>
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
                Add your quit and habit data in settings to see your results
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
    backgroundColor: '#03045e',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 12,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysNumberLarge: {
    fontSize: 56,
  },
  daysText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  sinceText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
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
    color: '#03045e',
    marginBottom: 20,
  },
  moneyAmountLarge: {
    fontSize: 28,
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
    color: '#03045e',
  },
  motivationBanner: {
    backgroundColor: '#F5F8FA',
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
    color: '#03045e',
    fontWeight: '500',
    flex: 1,
  },
  achievementInfo: {
    marginBottom: 12,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementBadge: {
    fontSize: 48,
    marginRight: 16,
  },
  achievementText: {
    flex: 1,
  },
  celebrationBanner: {
    backgroundColor: '#F5F8FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  celebrationText: {
    fontSize: 16,
    color: '#03045e',
    fontWeight: '600',
    flex: 1,
  },
  upcomingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  upcomingAchievementLabels: {
    marginBottom: 12,
  },
  upcomingAchievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  upcomingAchievementDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
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
    borderColor: '#03045e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  daysToGoNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#03045e',
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
    color: '#03045e',
  },
  achievementProgressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#03045e',
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
    color: '#03045e',
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
    backgroundColor: '#03045e',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#03045e',
  },
  viewAllButton: {
    backgroundColor: '#03045e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#03045e',
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
    borderColor: '#03045e',
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
    backgroundColor: '#03045e',
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
    color: '#03045e',
    letterSpacing: 0.5,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#03045e',
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
    backgroundColor: '#03045e',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  goalCard: {
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
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  goalTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: '#03045e',
  },

  goalDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalProgressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#03045e',
  },
  remainingText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  achievedBanner: {
    backgroundColor: '#F5F8FA',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  achievedEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  achievedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#03045e',
  },

  // Test button styles
  testButton: {
    backgroundColor: '#03045e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#03045e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  testButtonHelper: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },

});