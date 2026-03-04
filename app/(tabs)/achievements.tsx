import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Trophy, Target, TrendingUp, Crosshair, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAchievements } from '@/hooks/useAchievements';

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, stats, loading, error } = useAchievements();
  return (
    <>
      <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Achievements</Text>
            <Text style={styles.pageSubtitle}>Celebrate the wins, big and small.</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Trophy size={24} color="#35998d" />
            <Text style={styles.statNumber}>
              {loading ? '...' : error ? '0' : stats.totalEarned}
            </Text>
            <Text 
              style={styles.statLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Earned
            </Text>
          </View>
          <View style={styles.statBox}>
            <Target size={24} color="#FF6B47" />
            <Text style={styles.statNumber}>
              {loading ? '...' : error ? '0' : stats.daysFree}
            </Text>
            <Text 
              style={styles.statLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Days Free
            </Text>
          </View>
          <View style={styles.statBox}>
            <TrendingUp size={24} color="#35998d" />
            <Text style={styles.statNumber}>
              {loading ? '...' : error ? '0' : stats.totalToGo}
            </Text>
            <Text 
              style={styles.statLabel}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              To Go
            </Text>
          </View>
        </View>

                {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your progress milestones</Text>
          
          {loading ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>Loading...</Text>
              <Text style={styles.achievementDescription}>Please wait</Text>
            </View>
          ) : error ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>
                {error === 'future_quit_date' 
                  ? 'Achievements coming soon' 
                  : 'Complete onboarding'
                }
              </Text>
              <Text style={styles.achievementDescription}>
                {error === 'future_quit_date'
                  ? 'Your achievements will unlock when you quit'
                  : 'Set your quit date to track progress'
                }
              </Text>
            </View>
          ) : (
            <>
              {/* Current Achievement */}
              {stats.currentAchievement && (
                <>
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementContainer}>
                      <Text style={styles.achievementBadge}>{stats.currentAchievement.emoji}</Text>
                      <View style={styles.achievementText}>
                        <Text 
                          style={styles.achievementName}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {stats.currentAchievement.title}
                        </Text>
                        <Text 
                          style={styles.achievementDescription}
                          numberOfLines={3}
                          ellipsizeMode="tail"
                        >
                          {stats.currentAchievement.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.celebrationBanner}>
                    <Text style={styles.celebrationEmoji}>🎉</Text>
                    <Text style={styles.celebrationText}>
                      Congratulations! You've achieved {stats.currentAchievement.title}!
                    </Text>
                  </View>
                </>
              )}

              {/* Upcoming Achievement */}
              {stats.nextAchievement ? (
                <>
                  <View style={styles.upcomingSection}>
                    <Text style={styles.upcomingTitle}>Upcoming Achievement</Text>
                    
                    <View style={styles.achievementProgressContainer}>
                      <View style={styles.daysToGoBox}>
                        <Text style={styles.daysToGoNumber}>{stats.daysToNext}</Text>
                        <Text style={styles.daysToGoLabel}>Days to go</Text>
                      </View>
                      
                      <View style={styles.progressSection}>
                        <Text 
                          style={styles.upcomingAchievementName}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {stats.nextAchievement.title}
                        </Text>
                        <Text 
                          style={styles.upcomingAchievementDescription}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {stats.nextAchievement.description}
                        </Text>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>Progress</Text>
                          <Text style={styles.progressPercentage}>{stats.progressToNext}%</Text>
                        </View>
                        <View style={styles.achievementProgressBar}>
                          <View style={[styles.achievementProgressFill, { width: `${stats.progressToNext}%` }]} />
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.motivationBanner}>
                      <Text style={styles.motivationEmoji}>🎯</Text>
                      <Text 
                        style={styles.motivationText}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {stats.progressToNext >= 75 
                          ? `You're ${stats.progressToNext}% there! Keep going strong!`
                          : stats.progressToNext >= 50
                          ? `Halfway there! ${stats.daysToNext} days to go!`
                          : `Every day counts! ${stats.daysToNext} days to your next milestone!`
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

        {/* Milestones Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievement Milestones</Text>
          <Text style={styles.sectionSubtitle}>Your journey milestones and badges.</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading achievements...</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>
                {error === 'future_quit_date'
                  ? 'Achievements will unlock when you quit'
                  : 'Complete onboarding to see achievements'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.milestonesGrid}>
              {achievements.map((achievement) => (
                <View 
                  key={achievement.id}
                  style={[
                    styles.milestoneCard, 
                    achievement.achieved ? styles.milestoneUnlocked : styles.milestoneLocked
                  ]}
                >
                  <View style={styles.milestoneBadge}>
                    <Text style={achievement.achieved ? styles.badgeEmoji : styles.badgeEmojiLocked}>
                      {achievement.emoji}
                    </Text>
                  </View>
                  <Text 
                    style={[
                      styles.milestoneTitle, 
                      achievement.achieved ? styles.titleUnlocked : styles.titleLocked
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {achievement.title}
                  </Text>
                  <Text 
                    style={[
                      styles.milestoneDescription, 
                      achievement.achieved ? styles.descriptionUnlocked : styles.descriptionLocked
                    ]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {achievement.achieved 
                      ? achievement.description 
                      : `${achievement.daysToGo} days to go`
                    }
                  </Text>
                  {achievement.achieved && (
                    <View style={styles.checkmarkContainer}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      </SafeAreaView>
    </>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
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
  achievementInfo: {
    marginBottom: 12,
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
    flex: 1,
    flexWrap: 'wrap',
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  milestoneCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  milestoneUnlocked: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#35998d',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.2)',
  },
  milestoneLocked: {
    backgroundColor: 'rgba(245, 245, 245, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.8)',
  },
  milestoneBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeEmojiLocked: {
    fontSize: 24,
    opacity: 0.5,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleUnlocked: {
    color: '#1C1C1E',
  },
  titleLocked: {
    color: '#8E8E93',
  },
  milestoneDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  descriptionUnlocked: {
    color: '#8E8E93',
  },
  descriptionLocked: {
    color: '#C7C7CC',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#35998d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
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
    backgroundColor: 'rgba(53, 153, 141, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.3)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  celebrationEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  celebrationText: {
    fontSize: 16,
    color: '#35998d',
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
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
});