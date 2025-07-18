import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CreditCard as Edit, Trash2, Target, TrendingUp, Settings } from 'lucide-react-native';

export default function GoalsScreen() {
  const currentSavings = 1074;
  
  const calculateProgress = (targetAmount: number) => {
    return Math.min((currentSavings / targetAmount) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#35998d';
    if (progress >= 75) return '#35998d';
    if (progress >= 50) return '#FF9500';
    return '#FF6B47';
  };

  // Static sample data
  const goals = [
    {
      id: '1',
      name: 'Holiday to Dubai',
      targetAmount: 2000,
      description: 'Dream vacation to Dubai with family',
      createdAt: new Date(2025, 0, 1)
    },
    {
      id: '2',
      name: 'New Laptop',
      targetAmount: 1500,
      description: 'MacBook Pro for work',
      createdAt: new Date(2025, 0, 5)
    },
    {
      id: '3',
      name: 'Emergency Fund',
      targetAmount: 5000,
      description: 'Build up emergency savings',
      createdAt: new Date(2025, 0, 10)
    }
  ];

  const achievedGoals = goals.filter(goal => calculateProgress(goal.targetAmount) >= 100);
  const activeGoals = goals.filter(goal => calculateProgress(goal.targetAmount) < 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Goals</Text>
            <Text style={styles.pageSubtitle}>One goal at a time. You're getting there.</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Target size={24} color="#35998d" />
            <Text style={styles.progressTitle}>Goals Progress</Text>
          </View>
          <Text style={styles.progressSubtitle}>Overall completion of your financial goals</Text>
          
          <View style={styles.progressStats}>
            <Text style={styles.progressPercentage}>67%</Text>
            <Text style={styles.progressGoalsCount}>4 of 6 goals achieved</Text>
          </View>
          
          <View style={styles.bigProgressBar}>
            <View style={[styles.bigProgressFill, { width: '67%' }]} />
          </View>
        </View>

        {/* Add New Goal Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addButton}>
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
              const progress = calculateProgress(goal.targetAmount);
              const remaining = goal.targetAmount - currentSavings;
              
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalTarget}>{formatCurrency(goal.targetAmount)}</Text>
                    </View>
                    <View style={styles.goalActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Edit size={16} color="#35998d" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Trash2 size={16} color="#FF6B47" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {goal.description && (
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  )}

                  <View style={styles.progressContainer}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
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
                    {remaining > 0 && (
                      <Text style={styles.remainingText}>
                        {formatCurrency(remaining)} to go
                      </Text>
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
            
            {achievedGoals.map((goal) => (
              <View key={goal.id} style={[styles.goalCard, styles.achievedGoalCard]}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalTarget}>{formatCurrency(goal.targetAmount)}</Text>
                  </View>
                  <View style={styles.goalActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Edit size={16} color="#35998d" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Trash2 size={16} color="#FF6B47" />
                    </TouchableOpacity>
                  </View>
                </View>

                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}

                <View style={styles.achievedBanner}>
                  <Text style={styles.achievedEmoji}>🎯</Text>
                  <Text style={styles.achievedText}>Goal Achieved!</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
  progressSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#35998d',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  progressStats: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressPercentage: {
    fontSize: 48,
    fontWeight: '700',
    color: '#35998d',
    marginBottom: 8,
  },
  progressGoalsCount: {
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
    backgroundColor: '#35998d',
    borderRadius: 6,
    shadowColor: '#35998d',
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
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionSubtitle: {
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
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.2)',
    shadowColor: '#35998d',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  goalTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: '#35998d',
  },
  goalDescription: {
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
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
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
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  achievedBanner: {
    backgroundColor: 'rgba(53, 153, 141, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.2)',
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
    color: '#35998d',
  },
  bottomSpacing: {
    height: 100,
  },
});