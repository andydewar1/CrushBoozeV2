import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2, Target, TrendingUp, Settings } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useGoals, type Goal, type CreateGoal, type UpdateGoal } from '@/hooks/useGoals';
import { useQuitTimer } from '@/hooks/useQuitTimer';
import { useMoneySaved } from '@/hooks/useMoneySaved';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import AddEditGoalModal from '@/components/AddEditGoalModal';

export default function GoalsScreen() {
  const router = useRouter();
  const { 
    goals, 
    loading, 
    error, 
    activeGoals, 
    achievedGoals, 
    createGoal, 
    updateGoal, 
    deleteGoal, 
    markGoalAchieved,
    calculateGoalProgress,
    refetch
  } = useGoals();
  
  const { totalSaved, dailyRate, currency, loading: moneyLoading, error: savingsError } = useMoneySaved();
  const { error: timerError } = useQuitTimer();
  const isPreQuitMode = timerError === 'future_quit_date';
  const { financialGoal, loading: financialGoalLoading } = useFinancialGoals();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [onboardingGoalCreated, setOnboardingGoalCreated] = useState(false);

  // Remove automatic goal creation - let users create goals manually

  // Calculate total committed to achieved goals and available savings
  const totalCommitted = achievedGoals.reduce(
    (sum, g) => sum + g.target_amount,
    0
  );
  const availableSavings = Math.max(totalSaved - totalCommitted, 0);

  const savingsBlocked = moneyLoading || (!!savingsError && !isPreQuitMode);
  const displayDailyRate = savingsBlocked ? 0 : dailyRate;

  const getGoalEtaText = (remainingAmount: number, progress: number): string => {
    if (progress >= 100) {
      return "You're funded for this goal — mark it complete when you're ready.";
    }
    if (remainingAmount <= 0) {
      return 'Savings have reached this target — nice work.';
    }
    if (displayDailyRate <= 0) {
      return isPreQuitMode
        ? 'After quit day, your daily savings rate will fill this in — add your weekly spend in Settings if needed.'
        : 'Add your weekly alcohol spend in Settings to estimate how fast you will reach this goal.';
    }
    const savingsDays = Math.ceil(remainingAmount / displayDailyRate);
    const months = Math.floor(savingsDays / 30);
    const duration = savingsDays >= 30
      ? `about ${months} month${months === 1 ? '' : 's'}`
      : `${savingsDays} day${savingsDays === 1 ? '' : 's'}`;

    if (isPreQuitMode) {
      return `You're on track to achieve this goal ${duration} after quitting.`;
    }

    return `You'll unlock this goal in ${duration}.`;
  };

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

  const formatCurrency = (amount: number) => {
    return `${currency}${Math.floor(amount).toLocaleString()}`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#03045e';
    if (progress >= 75) return '#03045e';
    if (progress >= 50) return '#FF9500';
    return '#FF6B47';
  };

  const calculateOverallProgress = () => {
    if (goals.length === 0) return { percentage: 0, achievedCount: 0, totalCount: 0 };
    
    // Calculate average progress across all goals
    const totalProgress = goals.reduce((sum, goal) => {
      const progress = getGoalProgress(goal);
      return sum + progress;
    }, 0);
    
    const averageProgress = Math.round(totalProgress / goals.length);
    const achievedCount = achievedGoals.length;
    const totalCount = goals.length;
    
    return { 
      percentage: averageProgress, 
      achievedCount, 
      totalCount 
    };
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    setModalVisible(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setModalVisible(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSaveGoal = async (goalData: CreateGoal | { id: string; updates: UpdateGoal }) => {
    try {
      if ('id' in goalData) {
        // Editing existing goal
        await updateGoal(goalData.id, goalData.updates);
      } else {
        // Creating new goal
        await createGoal(goalData);
      }
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleMarkComplete = async (goal: Goal) => {
    // Calculate total already committed to achieved goals
    const totalCommitted = achievedGoals.reduce(
      (sum, g) => sum + g.target_amount,
      0
    );
    const requiredTotal = totalCommitted + goal.target_amount;
    const remainingNeeded = Math.max(0, requiredTotal - totalSaved);

    // Check if user has enough saved to cover all achieved goals + this one
    if (totalSaved < requiredTotal) {
      Alert.alert(
        'Not enough saved yet',
        `You already have ${currency}${totalCommitted.toFixed(
          2
        )} allocated to other achieved goals. You need ${currency}${remainingNeeded.toFixed(
          2
        )} more saved to complete this goal.`
      );
      return;
    }

    // User has enough saved, show confirmation
    Alert.alert(
      'Mark Goal Complete',
      `Congratulations! Are you ready to mark "${goal.name}" as achieved?`,
      [
        { text: 'Not Yet', style: 'cancel' },
        { 
          text: 'Mark Complete', 
          style: 'default',
          onPress: async () => {
            try {
              await markGoalAchieved(goal.id);
              Alert.alert('🎉 Congratulations!', `You've achieved your goal: "${goal.name}"! Well done!`);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark goal as complete. Please try again.');
            }
          }
        }
      ]
    );
  };

  const overallProgress = calculateOverallProgress();

  if (loading || moneyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Loading goals...</Text>
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
            <Text style={styles.pageTitle}>Goals</Text>
            <Text style={styles.pageSubtitle}>One goal at a time. You're getting there.</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Target size={24} color="#03045e" />
            <Text style={styles.progressTitle}>Goals Progress</Text>
          </View>
          <Text style={styles.progressSubtitle}>Overall completion of your financial goals</Text>
          
          <View style={styles.progressStats}>
            <Text style={styles.progressPercentage}>{overallProgress.percentage}%</Text>
            <Text style={styles.progressGoalsCount}>
              {overallProgress.achievedCount} of {overallProgress.totalCount} goals achieved
            </Text>
          </View>
          
          <View style={styles.bigProgressBar}>
            <View style={[styles.bigProgressFill, { width: `${overallProgress.percentage}%` }]} />
          </View>
        </View>

        {/* Add New Goal Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            <Text style={styles.sectionSubtitle}>Goals you're currently working towards.</Text>
            
            {activeGoals.map((goal) => {
              const progress = getGoalProgress(goal);
              const remaining = getRemainingForGoal(goal);
              const etaText = getGoalEtaText(remaining, progress);
              const hasGoalDescription =
                !!goal.description &&
                goal.description.trim().toLowerCase() !== goal.name.trim().toLowerCase();

              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalTarget}>{formatCurrency(goal.target_amount)}</Text>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditGoal(goal)}
                      >
                        <Pencil size={16} color="#03045e" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteGoal(goal)}
                      >
                        <Trash2 size={16} color="#FF6B47" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {hasGoalDescription && (
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
                    <View style={isPreQuitMode ? styles.goalEtaBox : styles.goalEtaPill}>
                      <Text style={isPreQuitMode ? styles.goalEtaBoxText : styles.goalEtaPillText}>{etaText}</Text>
                    </View>
                    {progress >= 100 && (
                      <TouchableOpacity 
                        style={styles.completeButton}
                        onPress={() => handleMarkComplete(goal)}
                      >
                        <Text style={styles.completeButtonText}>🎯 Mark as Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Achieved Goals */}
        {achievedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achieved Goals 🎉</Text>
            <Text style={styles.sectionSubtitle}>Goals you've successfully completed.</Text>
            
            {achievedGoals.map((goal) => {
              const hasGoalDescription =
                !!goal.description &&
                goal.description.trim().toLowerCase() !== goal.name.trim().toLowerCase();

              return (
                <View key={goal.id} style={[styles.goalCard, styles.achievedGoalCard]}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalTarget}>{formatCurrency(goal.target_amount)}</Text>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditGoal(goal)}
                      >
                        <Pencil size={16} color="#03045e" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteGoal(goal)}
                      >
                        <Trash2 size={16} color="#FF6B47" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {hasGoalDescription && (
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  )}

                  <View style={styles.achievedBanner}>
                    <Text style={styles.achievedEmoji}>🎯</Text>
                    <Text style={styles.achievedText}>Goal Achieved!</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && !loading && (
          <View style={styles.section}>
            <Text style={styles.emptyStateTitle}>No goals yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              {financialGoalLoading 
                ? 'Loading your onboarding goal...'
                : financialGoal && financialGoal.description 
                  ? 'Your onboarding goal is being added...'
                  : 'Create your first financial goal to start tracking your progress!'
              }
            </Text>
          </View>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add/Edit Goal Modal */}
      <AddEditGoalModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        goal={editingGoal}
        currency={currency.replace('$', 'USD').replace('€', 'EUR').replace('£', 'GBP').replace('A$', 'AUD').replace('C$', 'CAD')}
      />
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
  loadingText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
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
  progressSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#03045e',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  progressSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  progressStats: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressPercentage: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 48,
    fontWeight: '700',
    color: '#03045e',
    marginBottom: 8,
  },
  progressGoalsCount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  bigProgressBar: {
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bigProgressFill: {
    height: '100%',
    backgroundColor: '#03045e',
    borderRadius: 6,
    shadowColor: '#03045e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
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
  achievedGoalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  goalName: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  goalTarget: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    fontWeight: '700',
    color: '#03045e',
  },
  goalDescription: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  goalActions: {
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
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  goalProgressPercentage: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    color: '#03045e',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: '#03045e',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  goalEtaBox: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.2)',
    padding: 12,
  },
  goalEtaBoxText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: '#03045e',
    fontWeight: '600',
    lineHeight: 19,
  },
  goalEtaPill: {
    marginTop: 12,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(3, 4, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.24)',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  goalEtaPillText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: '#03045e',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  completeButton: {
    backgroundColor: '#03045e',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  achievedBanner: {
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.15)',
    justifyContent: 'center',
    marginTop: 12,
  },
  achievedEmoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    marginRight: 8,
  },
  achievedText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    color: '#03045e',
  },
  emptyStateTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 100,
  },
});