import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Trophy, Target, TrendingUp, Crosshair, Settings } from 'lucide-react-native';

export default function AchievementsScreen() {
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
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Trophy size={24} color="#35998d" />
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statBox}>
            <Target size={24} color="#FF6B47" />
            <Text style={styles.statNumber}>67</Text>
            <Text style={styles.statLabel}>Days Free</Text>
          </View>
          <View style={styles.statBox}>
            <TrendingUp size={24} color="#35998d" />
            <Text style={styles.statNumber}>13</Text>
            <Text style={styles.statLabel}>To Go</Text>
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

        {/* Early Milestones Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Early Milestones</Text>
          <Text style={styles.sectionSubtitle}>Your journey milestones and badges.</Text>
          
          <View style={styles.milestonesGrid}>
            {/* First Day Badge - Unlocked */}
            <View style={[styles.milestoneCard, styles.milestoneUnlocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmoji}>🎯</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleUnlocked]}>First Day</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionUnlocked]}>
                You took the first step
              </Text>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>

            {/* First Week Badge - Unlocked */}
            <View style={[styles.milestoneCard, styles.milestoneUnlocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmoji}>🌟</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleUnlocked]}>First Week</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionUnlocked]}>
                7 days smoke-free
              </Text>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>

            {/* $100 Saved Badge - Unlocked */}
            <View style={[styles.milestoneCard, styles.milestoneUnlocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmoji}>💰</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleUnlocked]}>$100 Saved</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionUnlocked]}>
                First savings milestone
              </Text>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>

            {/* First Month Badge - Unlocked */}
            <View style={[styles.milestoneCard, styles.milestoneUnlocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmoji}>🏆</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleUnlocked]}>First Month</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionUnlocked]}>
                30 days of freedom
              </Text>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>

            {/* $500 Saved Badge - Unlocked */}
            <View style={[styles.milestoneCard, styles.milestoneUnlocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmoji}>💎</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleUnlocked]}>$500 Saved</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionUnlocked]}>
                Major savings achieved
              </Text>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>

            {/* 2 Month Warrior Badge - Unlocked */}
            <View style={[styles.milestoneCard, styles.milestoneUnlocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmoji}>⚔️</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleUnlocked]}>2 Month Warrior</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionUnlocked]}>
                60 days of strength
              </Text>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>

            {/* $1000 Saved Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>🎖️</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>$1000 Saved</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                $26 to go
              </Text>
            </View>

            {/* 3 Month Titan Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>🛡️</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>3 Month Titan</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                23 days to go
              </Text>
            </View>

            {/* 6 Month Champion Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>👑</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>6 Month Champion</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                113 days to go
              </Text>
            </View>

            {/* 1 Year Legend Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>🌟</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>1 Year Legend</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                298 days to go
              </Text>
            </View>

            {/* 2 Year Legend Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>🏅</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>2 Year Legend</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                663 days to go
              </Text>
            </View>

            {/* 3 Year Master Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>🎖️</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>3 Year Master</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                1028 days to go
              </Text>
            </View>

            {/* 4 Year Elite Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>💫</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>4 Year Elite</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                1393 days to go
              </Text>
            </View>

            {/* 5 Year Immortal Badge - Locked */}
            <View style={[styles.milestoneCard, styles.milestoneLocked]}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.badgeEmojiLocked}>👑</Text>
              </View>
              <Text style={[styles.milestoneTitle, styles.titleLocked]}>5 Year Immortal</Text>
              <Text style={[styles.milestoneDescription, styles.descriptionLocked]}>
                1758 days to go
              </Text>
            </View>
          </View>
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
});