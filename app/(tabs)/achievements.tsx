import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Trophy, Target, TrendingUp, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAchievements } from '@/hooks/useAchievements';
import { useQuitTimer } from '@/hooks/useQuitTimer';
import { format } from 'date-fns';

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, stats, loading, error } = useAchievements();
  const { error: timerError, hours, minutes, quitDate } = useQuitTimer();
  const isPreQuitMode = timerError === 'future_quit_date';
  const nextAchievementTitle = stats.nextAchievement?.title || 'your next achievement';
  const preQuitAchievementText = quitDate
    ? `Your achievements unlock when you quit on ${format(quitDate, 'MMMM d, yyyy')}. Stay on track and each milestone will mark a real alcohol-free win.`
    : 'Your achievements unlock when your alcohol-free journey begins. Stay on track and each milestone will mark a real alcohol-free win.';

  // UI-only day-1 motivation tweak:
  // When "First Day" is the upcoming (locked) milestone, show progress based on
  // the time elapsed within that first 24h period (day 0 -> day 1 ramp).
  const isLockedDay1OnAchievementsPage =
    !isPreQuitMode && !stats.currentAchievement && stats.nextAchievement?.id === 'day1';

  const day1ProgressPercent = Math.max(
    0,
    Math.min(100, Math.round(((hours * 60) + minutes) / (24 * 60) * 100))
  );

  const progressToNextForUI = isLockedDay1OnAchievementsPage
    ? day1ProgressPercent
    : stats.progressToNext;
  const achievementMotivationText = isPreQuitMode
    ? preQuitAchievementText
    : `You're ${progressToNextForUI}% of the way to ${nextAchievementTitle}. Stay alcohol-free and you're one step closer to unlocking your next achievement!`;
  const currentAchievementMotivationText = stats.currentAchievement
    ? `Congratulations! You've unlocked ${stats.currentAchievement.title}. That's proof your alcohol-free time is adding up, and every day you keep going makes the next milestone easier to reach.`
    : '';

  return (
    <>
      <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Achievements</Text>
            <Text style={styles.pageSubtitle}>
              {isPreQuitMode
                ? 'Preview — everything here unlocks once your sober clock starts.'
                : 'Celebrate the wins, big and small.'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats — same layout as Logs */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <Trophy size={18} color="#03045e" />
            </View>
            <Text style={styles.statNumberPremium}>
              {loading ? '…' : error ? '0' : stats.totalEarned}
            </Text>
            <Text style={styles.statLabelCaps}>Earned</Text>
          </View>
          <View style={styles.statDividerVert} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, styles.statIconCircleWarm]}>
              <Target size={18} color="#FF6B47" />
            </View>
            <Text style={styles.statNumberPremium}>
              {loading ? '…' : error ? '0' : stats.daysFree.toLocaleString()}
            </Text>
            <Text style={styles.statLabelCaps}>Days free</Text>
          </View>
          <View style={styles.statDividerVert} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, styles.statIconCircleWarm]}>
              <TrendingUp size={18} color="#FF6B47" />
            </View>
            <Text style={styles.statNumberPremium}>
              {loading ? '…' : error ? '0' : stats.totalToGo}
            </Text>
            <Text style={styles.statLabelCaps}>To go</Text>
          </View>
        </View>

                {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Every milestone earned, forever.</Text>
          
          {loading ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>Loading...</Text>
              <Text style={styles.achievementDescription}>Please wait</Text>
            </View>
          ) : error ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>Complete onboarding</Text>
              <Text style={styles.achievementDescription}>Set your quit date to track progress</Text>
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
                  
                  <View style={styles.achievementCongratsBanner}>
                    <Text style={styles.achievementCongratsText}>
                      {currentAchievementMotivationText}
                    </Text>
                  </View>
                </>
              )}
              {!stats.currentAchievement && stats.nextAchievement && (
                <View style={styles.achievementInfo}>
                  <View style={[styles.achievementContainer, styles.lockedAchievementContainer]}>
                    <Text style={[styles.achievementBadge, styles.lockedAchievementBadge]}>
                      {stats.nextAchievement.emoji}
                    </Text>
                    <View style={styles.achievementText}>
                      <Text style={[styles.achievementName, styles.lockedAchievementName]}>
                        {stats.nextAchievement.title}
                      </Text>
                      <Text style={[styles.achievementDescription, styles.lockedAchievementDescription]}>
                        {stats.nextAchievement.daysToGo}{' '}
                        {stats.nextAchievement.daysToGo === 1 ? 'day' : 'days'} to go
                      </Text>
                    </View>
                  </View>
                </View>
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
                          <Text style={styles.progressPercentage}>{progressToNextForUI}%</Text>
                        </View>
                        <View style={styles.achievementProgressBar}>
                          <View style={[styles.achievementProgressFill, { width: `${progressToNextForUI}%` }]} />
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.goalEtaPill}>
                      <Text style={styles.goalEtaText}>
                        {achievementMotivationText}
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
          <View style={styles.sectionHeader}>
            <Trophy size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Achievement Milestones</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{"Proof of how far you've come."}</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading achievements...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>Complete onboarding to see achievements</Text>
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
                      : `${achievement.daysToGo} ${achievement.daysToGo === 1 ? 'day' : 'days'} to go`}
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
    marginBottom: 16,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    marginBottom: 4,
    letterSpacing: -0.35,
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
    lineHeight: 19,
  },
  achievementInfo: {
    marginBottom: 12,
  },
  achievementName: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  achievementDescription: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 24,
    fontWeight: '700',
    color: '#03045e',
    marginBottom: 4,
  },
  daysToGoLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  progressSection: {
    flex: 1,
  },
  upcomingAchievementName: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  upcomingAchievementDescription: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressPercentage: {
    fontFamily: FONT_FAMILY_UI,
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
  goalEtaPill: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.2)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalEtaText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#03045e',
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 20,
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
    shadowColor: '#03045e',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.2)',
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 24,
  },
  badgeEmojiLocked: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 24,
    opacity: 0.5,
  },
  milestoneTitle: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
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
    backgroundColor: '#03045e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedAchievementContainer: {
    opacity: 0.7,
  },
  achievementBadge: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 48,
    marginRight: 16,
  },
  lockedAchievementBadge: {
    opacity: 0.5,
  },
  achievementText: {
    flex: 1,
  },
  lockedAchievementName: {
    color: '#8E8E93',
  },
  lockedAchievementDescription: {
    color: '#AEAEB2',
    marginBottom: 0,
  },
  achievementCongratsBanner: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(3, 4, 94, 0.1)',
    borderColor: 'rgba(3, 4, 94, 0.26)',
  },
  achievementCongratsText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    color: '#03045e',
    lineHeight: 20,
    textAlign: 'left',
  },
  upcomingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  upcomingTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
});