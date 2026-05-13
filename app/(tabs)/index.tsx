import { View, Text, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { DollarSign, Heart, Target, Check, Trophy, Crosshair, TrendingUp, MessageCircle, Sun, Calendar, Smile, BarChart2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Header from '../../components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useQuitTimer } from '@/hooks/useQuitTimer';
import { useMoneySaved } from '@/hooks/useMoneySaved';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { useGoals, type Goal } from '@/hooks/useGoals';
import { useQuitMotivation } from '@/hooks/useQuitMotivation';
import { useHealthRecovery } from '@/hooks/useHealthRecovery';
import { useAchievements } from '@/hooks/useAchievements';
import { useCheckinHistory, moodLabelFromAverage } from '@/hooks/useCheckinHistory';
import { usePreQuitDrinkSupport, type PrepDrinkChecklist } from '@/hooks/usePreQuitDrinkSupport';
import { useSettings } from '@/contexts/SettingsContext';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RevenueCatService from '@/services/RevenueCatService';
import { format } from 'date-fns';
import { initializeFacebookSDK, logAppInstall } from '@/lib/facebook';

/** Navy brand accent; kept as `NIC_TEAL` for CrushNic parity and Hermes/bundler compatibility. */
const NIC_TEAL = '#03045e';

const MOODS = [
  { emoji: '😊', label: 'Great' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Rough' },
] as const;

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Pre-quit home UI matches CrushNic layout; accent is navy (NIC_TEAL). */
function moodEmojiForStoredLabel(label: string): string {
  const hit = MOODS.find(m => m.label === label);
  if (hit) return hit.emoji;
  if (label === 'Strong' || label === 'Calm') return '😊';
  if (label === 'Struggling') return '😐';
  return '😐';
}

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const { settings } = useSettings();
  const { days, hours, minutes, quitDate, loading: timerLoading, error: timerError } = useQuitTimer();
  const { totalSaved, dailyRate, hourlyRate, currency, loading: savingsLoading, error: savingsError } = useMoneySaved();
  const { financialGoal, loading: goalLoading, error: goalError, getCurrencySymbol } = useFinancialGoals();
  const { activeGoals, achievedGoals, calculateGoalProgress, refetch: refetchGoals } = useGoals();
  const { motivation, loading: motivationLoading, error: motivationError } = useQuitMotivation();
  const { milestones: healthMilestones, loading: healthLoading, error: healthError } = useHealthRecovery();
  const {
    achievements,
    stats: achievementStats,
    loading: achievementsLoading,
    error: achievementsError,
  } = useAchievements();

  const isPreQuitMode = timerError === 'future_quit_date';

  // Home UX tweak:
  // When a user is on their first sober day (day 0 -> day 1 transition) we want
  // the "First Day" milestone to be visibly locked while progress builds smoothly.
  const isLockedDay1OnHomePreview =
    !isPreQuitMode &&
    !achievementStats.currentAchievement &&
    achievementStats.nextAchievement?.id === 'day1';

  const day1ProgressPercent = Math.max(
    0,
    Math.min(100, Math.round(((hours * 60) + minutes) / (24 * 60) * 100))
  );
  const achievementProgressToNextForHome = isLockedDay1OnHomePreview
    ? day1ProgressPercent
    : achievementStats.progressToNext;
  const {
    checklist,
    checklistCompletedCount,
    checklistTotalCount,
    prepWeekDaysCompleted,
    prepWeekSlots,
    todayDrinks,
    weekDrinks,
    weekMaxDrinks,
    toggleChecklistItem,
    addDrink,
    removeDrink,
  } = usePreQuitDrinkSupport(session?.user?.id, isPreQuitMode);
  const [isEditingPrepChecklist, setIsEditingPrepChecklist] = useState(false);
  const prevChecklistFullyCompleteRef = useRef(checklistCompletedCount === checklistTotalCount);

  const moodPickRef = useRef<string | null>(null);
  const drinkPickRef = useRef<'clean' | 'drank' | null>(null);
  const checkinFeedbackAnim = useRef(new Animated.Value(0)).current;
  const [pickMood, setPickMood] = useState<string | null>(null);
  const [pickDrink, setPickDrink] = useState<'clean' | 'drank' | null>(null);
  const {
    hydrated: checkinHydrated,
    todayKey,
    todayCheckin,
    recordCheckin,
    clearTodayCheckin,
    refresh: refreshCheckins,
    currentWeekSlots,
    currentWeekCheckedCount,
    thisWeekStats,
  } = useCheckinHistory();
  const prevHadTodayCheckinRef = useRef(!!todayCheckin);

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

  const getGoalEtaText = (remainingAmount: number): string | null => {
    if (displayDailyRate <= 0 || remainingAmount <= 0) return null;
    const savingsDays = Math.ceil(remainingAmount / displayDailyRate);
    const months = Math.floor(savingsDays / 30);
    const duration = savingsDays >= 30
      ? `about ${months} month${months === 1 ? '' : 's'}`
      : `${savingsDays} day${savingsDays === 1 ? '' : 's'}`;

    if (isPreQuitMode && quitDate) {
      return `Your goals unlock when you quit on ${format(quitDate, 'MMMM d, yyyy')}. Stay on track and ${duration} after quitting, you'll achieve this goal.`;
    }

    return `If you stay alcohol-free, you're set to achieve this goal in ${duration}. Keep up the good work!`;
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
          console.log('[Home] ✅ Permission granted! Scheduling daily 8:30pm notification...');
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

  useFocusEffect(
    useCallback(() => {
      refreshCheckins();
    }, [refreshCheckins])
  );

  useEffect(() => {
    moodPickRef.current = null;
    drinkPickRef.current = null;
    setPickMood(null);
    setPickDrink(null);
  }, [todayKey]);

  useEffect(() => {
    const hasTodayCheckin = !!todayCheckin;
    const hadTodayCheckin = prevHadTodayCheckinRef.current;
    const isSuccessCheckin = todayCheckin?.status === 'clean';

    if (hasTodayCheckin && !hadTodayCheckin && isSuccessCheckin) {
      checkinFeedbackAnim.setValue(0);
      Animated.sequence([
        Animated.timing(checkinFeedbackAnim, {
          toValue: 1.12,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.spring(checkinFeedbackAnim, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (hasTodayCheckin) {
      checkinFeedbackAnim.setValue(1);
    }

    if (!hasTodayCheckin) {
      checkinFeedbackAnim.setValue(0);
    }

    prevHadTodayCheckinRef.current = hasTodayCheckin;
  }, [todayCheckin, checkinFeedbackAnim]);

  useEffect(() => {
    const isFullyComplete = checklistCompletedCount === checklistTotalCount;
    const wasFullyComplete = prevChecklistFullyCompleteRef.current;
    if (!wasFullyComplete && isFullyComplete && isEditingPrepChecklist) {
      setIsEditingPrepChecklist(false);
    }
    prevChecklistFullyCompleteRef.current = isFullyComplete;
  }, [checklistCompletedCount, checklistTotalCount, isEditingPrepChecklist]);

  const onPickMood = async (label: string) => {
    moodPickRef.current = label;
    setPickMood(label);
    const v = drinkPickRef.current;
    if (v && !todayCheckin) {
      await recordCheckin(v, label);
    }
  };

  const onPickDrink = async (v: 'clean' | 'drank') => {
    drinkPickRef.current = v;
    setPickDrink(v);
    const m = moodPickRef.current;
    if (m && !todayCheckin) {
      await recordCheckin(v, m);
    }
  };

  const onChangeTodayCheckin = () => {
    moodPickRef.current = null;
    drinkPickRef.current = null;
    setPickMood(null);
    setPickDrink(null);
    clearTodayCheckin();
  };

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

  // Show loading or error state for savings (future quit still has projected rates)
  const savingsDisplayBlocked = savingsLoading || (!!savingsError && !isPreQuitMode);
  const displayTotalSaved = isPreQuitMode ? 0 : savingsDisplayBlocked ? 0 : totalSaved;
  const displayDailyRate = savingsDisplayBlocked ? 0 : dailyRate;
  const displayHourlyRate = savingsDisplayBlocked ? 0 : hourlyRate;
  const displayCurrency = currency || '$';

  const projectedSavingsDate = quitDate
    ? new Date(quitDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const projectedSavingsThirtyDays = displayDailyRate * 30;

  const prepChecklistItems: Array<{ key: keyof PrepDrinkChecklist; label: string }> = [
    { key: 'delayFirstDrink', label: 'Delay your first drink' },
    { key: 'resistOneUrge', label: 'Log one urge to drink' },
    { key: 'reviewWhy', label: 'Read your personal why' },
  ];
  const firstWeekDrinkDataIndex = weekDrinks.findIndex(d => d.count > 0);
  const weekDrinksTotal = weekDrinks.reduce((sum, d) => sum + d.count, 0);
  const nextAchievementTitle = achievementStats.nextAchievement?.title || 'your next achievement';
  const achievementMotivationText = `You're ${achievementProgressToNextForHome}% of the way to ${nextAchievementTitle}. Stay alcohol-free and you're one step closer to unlocking your next achievement!`;
  const currentAchievementMotivationText = achievementStats.currentAchievement
    ? `Congratulations! You've unlocked ${achievementStats.currentAchievement.title}. That's proof your alcohol-free time is adding up, and every day you keep going makes the next milestone easier to reach.`
    : '';

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
    // For smaller amounts, show with 2 decimals and commas
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${Math.floor(amount).toLocaleString()}`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return NIC_TEAL;
    if (progress >= 75) return NIC_TEAL;
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
                  {displayDays.toLocaleString()}
                </Text>
                <Text style={styles.daysText}>{displayText}</Text>
                {!timerError || timerError === 'future_quit_date' ? (
                  <Text style={styles.timeText}>{displayHours}h {displayMinutes}m</Text>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={styles.sinceText}>
            {timerError === 'future_quit_date'
              ? quitDate 
                ? `Your journey begins ${format(quitDate, 'MMMM d, yyyy')}`
                : 'Your journey begins soon'
              : timerError
                ? 'Add your quit date in settings to see your results' 
                : quitDate 
                  ? `Since ${format(quitDate, 'MMMM d, yyyy')}` 
                  : 'Since you quit'
            }
          </Text>
        </View>

        {isPreQuitMode && (
          <View style={styles.section}>
            <View style={styles.checkInHeaderBlock}>
              <View style={styles.checkInHeaderRow}>
                <View style={styles.checkInTitleCluster}>
                  <View style={styles.checkInSectionHeader}>
                    <BarChart2 size={20} color={NIC_TEAL} />
                    <Text style={[styles.sectionTitle, styles.checkInSectionTitle]}>Drink Tracker</Text>
                  </View>
                  <View style={styles.checkInSubtitleLines}>
                    <Text style={styles.checkInSectionSubtitleLine}>
                      {"Log each drink today. We'll help you see the pattern before you quit."}
                    </Text>
                  </View>
                </View>
                <View style={styles.streakBadgeCol}>
                <View style={[styles.streakPill, styles.preQuitNicStreakPill]}>
                  <View style={[styles.streakBadge, styles.vapeTrackerStreakBadge]}>
                      <Text style={styles.streakCountBlack}>{todayDrinks}</Text>
                    </View>
                    <Text style={styles.streakCaption}>Drinks logged today</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.puffCard, styles.puffCardInSection]}>
              <TouchableOpacity
                style={styles.puffLogVapeCircle}
                onPress={() => void addDrink()}
                activeOpacity={0.9}
              >
                <Text style={styles.puffLogVapeCircleText}>Log drink</Text>
              </TouchableOpacity>
              <View style={styles.puffUndoColumn}>
                <TouchableOpacity
                  style={styles.puffUndoButton}
                  onPress={() => void removeDrink()}
                  activeOpacity={0.9}
                >
                  <Text style={styles.puffUndoButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.puffUndoHint}>Tap if you need to undo.</Text>
              </View>

              <View style={styles.puffWeekRow}>
                {weekDrinks.map((day, i) => {
                  const prevCount = i > 0 ? weekDrinks[i - 1].count : null;
                  const isFirstDataDayInWeek =
                    firstWeekDrinkDataIndex !== -1 && i === firstWeekDrinkDataIndex;
                  const isUpFromPriorDay =
                    i > 0 &&
                    prevCount != null &&
                    !isFirstDataDayInWeek &&
                    day.count > prevCount;
                  const barGreen = !isUpFromPriorDay && day.count > 0;
                  const countGreen = !isUpFromPriorDay && (day.count > 0 || day.isToday);
                  return (
                    <View key={day.key} style={styles.puffDayCell}>
                      <View style={styles.puffBarTrack}>
                        <View
                          style={[
                            styles.puffBarFill,
                            isUpFromPriorDay
                              ? styles.puffBarFillUp
                              : barGreen
                                ? styles.puffBarFillToday
                                : null,
                            {
                              height: `${Math.max(8, (day.count / weekMaxDrinks) * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.puffDayCount,
                          countGreen && styles.puffDayCountToday,
                          isUpFromPriorDay && styles.puffDayCountUp,
                        ]}
                      >
                        {day.count}
                      </Text>
                      <Text style={[styles.puffDayLabel, day.isToday && styles.puffDayLabelToday]}>
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.vapeTrackerEaseBackHint}>
                Try to ease back your drinking a little every day — it softens the shock when you quit.
              </Text>
              <Text style={styles.vapeTrackerWeekSummary}>
                You have had {weekDrinksTotal} {weekDrinksTotal === 1 ? 'drink' : 'drinks'} this week.
              </Text>
            </View>
          </View>
        )}

        {/* Daily Check-in */}
        <View style={styles.section}>
          <View style={styles.checkInHeaderBlock}>
            <View style={styles.checkInHeaderRow}>
              <View style={styles.checkInTitleCluster}>
                <View style={styles.checkInSectionHeader}>
                  <Sun size={20} color={NIC_TEAL} />
                  <Text style={[styles.sectionTitle, styles.checkInSectionTitle]}>
                    {isPreQuitMode ? 'Quit Prep' : 'Daily Check-in'}
                  </Text>
                </View>
                <View style={styles.checkInSubtitleLines}>
                  {isPreQuitMode ? (
                    <>
                      <Text style={styles.checkInSectionSubtitleLine}>Get ready before quit day.</Text>
                      <Text style={styles.checkInSectionSubtitleLine}>Small daily wins build momentum.</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.checkInSectionSubtitleLine}>Keep your streak alive.</Text>
                      <Text style={styles.checkInSectionSubtitleLine}>Check in before you forget.</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.streakBadgeCol}>
                <View style={[styles.streakPill, isPreQuitMode && styles.preQuitNicStreakPill]}>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakFire}>🔥</Text>
                    <Text style={styles.streakCountBlack}>
                      {isPreQuitMode ? prepWeekDaysCompleted : checkinHydrated ? currentWeekCheckedCount : '—'}
                    </Text>
                    <Text style={styles.streakSlashOutOf}>/7</Text>
                  </View>
                  <Text style={styles.streakCaption}>{isPreQuitMode ? 'Prep streak' : 'This week'}</Text>
                </View>
              </View>
            </View>
          </View>

          {!isPreQuitMode ? (
            !todayCheckin ? (
            <View style={styles.checkinFormSurface}>
              <Text style={styles.checkInQuestion}>How are you feeling today?</Text>
              <View style={styles.checkinSegmentTray}>
                {MOODS.map((mood, i) => (
                  <Fragment key={mood.label}>
                    {i > 0 ? <View style={styles.checkinSegmentHairline} /> : null}
                    <TouchableOpacity
                      style={[styles.moodOptionInRow, pickMood === mood.label && styles.moodOptionSelected]}
                      onPress={() => onPickMood(mood.label)}
                      activeOpacity={0.92}
                    >
                      <Text style={[styles.moodEmoji, pickMood === mood.label && styles.moodEmojiSelected]}>
                        {mood.emoji}
                      </Text>
                      <Text style={[styles.moodLabel, pickMood === mood.label && styles.moodLabelSelected]}>
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  </Fragment>
                ))}
              </View>
              <Text style={[styles.checkInQuestion, styles.checkInQuestionSecond]}>Have you had alcohol today?</Text>
              <View style={styles.checkinSegmentTray}>
                <TouchableOpacity
                  style={[
                    styles.checkinDrinkButtonHalf,
                    pickDrink === 'clean' && styles.checkinDrinkButtonCleanOn,
                  ]}
                  onPress={() => onPickDrink('clean')}
                  activeOpacity={0.92}
                >
                  <Text style={styles.checkinDrinkEmoji}>😊</Text>
                  <Text
                    style={[
                      styles.checkinDrinkButtonLabel,
                      pickDrink === 'clean' && styles.checkinDrinkButtonLabelCleanOn,
                    ]}
                  >
                    Nope!
                  </Text>
                </TouchableOpacity>
                <View style={styles.checkinSegmentHairline} />
                <TouchableOpacity
                  style={[
                    styles.checkinDrinkButtonHalf,
                    pickDrink === 'drank' && styles.checkinDrinkButtonDrankOn,
                  ]}
                  onPress={() => onPickDrink('drank')}
                  activeOpacity={0.92}
                >
                  <Text style={styles.checkinDrinkEmoji}>😢</Text>
                  <Text
                    style={[
                      styles.checkinDrinkButtonLabel,
                      pickDrink === 'drank' && styles.checkinDrinkButtonLabelDrankOn,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.checkinDoneCard}>
              <View style={styles.checkinDoneTitleRow}>
                <Text style={styles.checkinDoneTitle}>{"You're checked in for today."}</Text>
                <TouchableOpacity onPress={onChangeTodayCheckin} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
                  <Text style={styles.checkinChangeLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.checkInDoneRow}>
                {todayCheckin.mood && (
                  <View style={styles.checkInMoodBadge}>
                    <Text style={styles.checkInMoodBadgeText}>
                      {moodEmojiForStoredLabel(todayCheckin.mood)} {todayCheckin.mood}
                    </Text>
                  </View>
                )}
                <View style={[styles.checkInAnsweredBadge, todayCheckin.status === 'clean' ? styles.badgeClean : styles.badgeDrank]}>
                  <Text style={[styles.checkInAnsweredText, todayCheckin.status === 'clean' ? styles.badgeCleanText : styles.badgeDrankText]}>
                    {todayCheckin.status === 'clean' ? 'Dry today' : 'Slipped today'}
                  </Text>
                </View>
              </View>
              <Animated.View
                style={[
                  styles.checkinFeedbackBanner,
                  todayCheckin.status === 'clean'
                    ? styles.checkinFeedbackBannerClean
                    : styles.checkinFeedbackBannerDrank,
                  {
                    opacity: checkinFeedbackAnim.interpolate({
                      inputRange: [0, 0.25, 1],
                      outputRange: [0, 1, 1],
                      extrapolate: 'clamp',
                    }),
                    transform: [
                      {
                        translateY: checkinFeedbackAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [6, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                      { scale: checkinFeedbackAnim },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.checkInEncouragement,
                    todayCheckin.status === 'clean'
                      ? styles.checkInEncouragementClean
                      : styles.checkInEncouragementDrank,
                  ]}
                >
                  {todayCheckin.status === 'clean'
                    ? "Another day you didn't let drinking win 💪"
                    : "It's okay. Don't turn one slip into a spiral 💪"}
                </Text>
              </Animated.View>
            </View>
          )
          ) : (
            <View style={styles.preQuitCard}>
              <Text style={styles.preQuitTitle}>
                {quitDate
                  ? `Your quit date is ${format(quitDate, 'MMMM d')}.`
                  : 'Your quit date is coming up.'}
              </Text>
              <Text style={styles.preQuitSubtitle}>
                {"Complete this checklist every day until quit day so you're ready."}
              </Text>
              <Text style={styles.preQuitProgress}>
                {checklistCompletedCount}/{checklistTotalCount} complete today
              </Text>
              {checklistCompletedCount === checklistTotalCount && (
                <View style={styles.preQuitCongratsBanner}>
                  <View style={styles.preQuitCongratsRow}>
                    <Text style={styles.preQuitCongratsText}>
                      {
                        "Congrats — you've completed today's tasks, you're one step closer to being alcohol free 💪"
                      }
                    </Text>
                    <TouchableOpacity
                      style={styles.preQuitEditButton}
                      onPress={() => setIsEditingPrepChecklist(prev => !prev)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.preQuitEditButtonText}>
                        {isEditingPrepChecklist ? 'Done' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {(checklistCompletedCount !== checklistTotalCount || isEditingPrepChecklist) && (
                <View style={styles.preQuitChecklist}>
                  {prepChecklistItems.map(item => {
                    const done = checklist[item.key];
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.preQuitChecklistItem, done && styles.preQuitChecklistItemDone]}
                        onPress={() => void toggleChecklistItem(item.key)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.preQuitCheckbox, done && styles.preQuitCheckboxDone]}>
                          {done ? <Text style={styles.preQuitCheckboxTick}>✓</Text> : null}
                        </View>
                        <Text style={[styles.preQuitChecklistLabel, done && styles.preQuitChecklistLabelDone]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={[styles.checkinWeekPanel, styles.preQuitPrepStreakPanel]}>
                <Text style={styles.checkinSubsectionTitle}>Prep streak this week</Text>
                <View style={[styles.checkinWeekCard, styles.preQuitNicWeekCard]}>
                  <View style={[styles.checkinDotRow, styles.preQuitNicDotRow]}>
                    {prepWeekSlots.map((slot, i) => (
                      <View key={slot.key} style={[styles.checkinDotCell, styles.preQuitNicDotCell]}>
                        <View style={[styles.preQuitNicDotWrap, slot.isToday && styles.preQuitNicDotWrapToday]}>
                          <View
                            style={[
                              styles.preQuitNicDot,
                              !slot.completed && styles.preQuitNicDotEmpty,
                              slot.completed && styles.preQuitNicDotComplete,
                            ]}
                          />
                        </View>
                        <Text style={[styles.checkinDotLabel, slot.isToday && styles.preQuitNicDotLabelToday]}>
                          {WEEKDAY_LABELS[i]}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.checkinLegendRow, styles.preQuitPrepLegendRow]}>
                    <View style={[styles.checkinLegendChip, styles.preQuitPrepLegendChip]}>
                      <View style={[styles.checkinLegendDot, styles.preQuitNicLegendDotComplete]} />
                      <Text style={[styles.checkinLegendChipText, styles.preQuitPrepLegendChipText]}>
                        Tasks complete
                      </Text>
                    </View>
                    <View style={[styles.checkinLegendChip, styles.preQuitPrepLegendChip]}>
                      <View style={[styles.checkinLegendDot, styles.preQuitNicLegendDotEmpty]} />
                      <Text style={[styles.checkinLegendChipText, styles.preQuitPrepLegendChipText]}>
                        Not complete
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {!isPreQuitMode && (
            <View style={styles.checkinWeekPanel}>
              <Text style={styles.checkinSubsectionTitle}>This week</Text>
              <View style={styles.checkinWeekCard}>
                <View style={styles.checkinDotRow}>
                  {currentWeekSlots.map((slot, i) => (
                    <View key={slot.key} style={styles.checkinDotCell}>
                      <View style={[styles.checkinDotWrap, slot.isToday && styles.checkinDotWrapToday]}>
                        <View
                          style={[
                            styles.checkinDot,
                            !slot.status && styles.checkinDotEmpty,
                            slot.status?.status === 'clean' && styles.checkinDotClean,
                            slot.status?.status === 'drank' && styles.checkinDotDrank,
                          ]}
                        />
                      </View>
                      <Text style={[styles.checkinDotLabel, slot.isToday && styles.checkinDotLabelToday]}>
                        {WEEKDAY_LABELS[i]}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.checkinLegendRow}>
                  <View style={styles.checkinLegendChip}>
                    <View style={[styles.checkinLegendDot, styles.checkinLegendDotClean]} />
                    <Text style={styles.checkinLegendChipText}>Dry</Text>
                  </View>
                  <View style={styles.checkinLegendChip}>
                    <View style={[styles.checkinLegendDot, styles.checkinLegendDotDrank]} />
                    <Text style={styles.checkinLegendChipText}>Slipped</Text>
                  </View>
                  <View style={styles.checkinLegendChip}>
                    <View style={[styles.checkinLegendDot, styles.checkinLegendDotEmpty]} />
                    <Text style={styles.checkinLegendChipText}>No check-in</Text>
                  </View>
                </View>
              </View>

              <View style={styles.checkinStatsGrid}>
                <View style={styles.checkinStatsRow}>
                  <TouchableOpacity style={styles.checkinStatCard} activeOpacity={0.88}>
                    <View style={[styles.checkinStatIconCircle, styles.checkinStatIconNavy]}>
                      <Calendar size={18} color={NIC_TEAL} />
                    </View>
                    <Text style={styles.checkinStatCardValue}>
                      {thisWeekStats.checkins}
                      <Text style={styles.checkinStatCardDenom}>/7</Text>
                    </Text>
                    <Text style={styles.checkinStatCardLabel}>Check-ins this week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.checkinStatCard} activeOpacity={0.88}>
                    <View style={[styles.checkinStatIconCircle, styles.checkinStatIconNavy]}>
                      <Smile size={18} color={NIC_TEAL} />
                    </View>
                    <Text style={styles.checkinStatCardValue}>
                      {thisWeekStats.avgMood != null
                        ? moodLabelFromAverage(thisWeekStats.avgMood)
                        : '—'}
                    </Text>
                    <Text style={styles.checkinStatCardLabel}>Avg. mood</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Money Saved Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={NIC_TEAL} />
            <Text style={styles.sectionTitle}>Money Saved</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {isPreQuitMode
              ? 'Nothing banked yet — real savings start after quit day.'
              : 'Total savings so far.'}
          </Text>
          <Text
            style={[
              styles.moneyAmount,
              isPreQuitMode && styles.preQuitNicMoneyAmount,
              displayTotalSaved >= 100000 && styles.moneyAmountLarge,
            ]}
          >
            {displayCurrency}
            {formatMoneyDetailed(displayTotalSaved)}
          </Text>
          {isPreQuitMode ? (
            <Text style={styles.preQuitMoneyFootnote}>
              {
                "This stays at zero until you're alcohol-free; the breakdown below is what you're on track to keep."
              }
            </Text>
          ) : null}

          {isPreQuitMode ? (
            <>
              <View style={[styles.motivationBanner, styles.motivationBannerPreQuitMoney]}>
                <Text style={[styles.motivationText, styles.moneyMotivationText, styles.preQuitNicMotivationText]}>
                  {quitDate && projectedSavingsDate && projectedSavingsThirtyDays > 0
                    ? `Your savings clock starts ${format(quitDate, 'MMMM d, yyyy')}. Stay on track and by ${format(projectedSavingsDate, 'MMMM d')} you could have about ${displayCurrency}${formatMoneyDetailed(projectedSavingsThirtyDays)} more in your pocket than if you'd kept drinking.`
                    : projectedSavingsThirtyDays > 0
                      ? 'After quit day, every dry day adds real money here.'
                      : 'Set your habit spend in settings to personalize this estimate.'}
                </Text>
              </View>
              <Text style={styles.preQuitMoneyRatesHeading}>{"Here's what you'll save when you quit"}</Text>
            </>
          ) : null}

          <View style={styles.ratesContainer}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Weekly rate:</Text>
              <Text style={[styles.rateValue, isPreQuitMode && styles.preQuitNicRateValue]}>
                {displayCurrency}
                {formatMoneyDetailed(displayDailyRate * 7)}
              </Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Daily rate:</Text>
              <Text style={[styles.rateValue, isPreQuitMode && styles.preQuitNicRateValue]}>
                {displayCurrency}
                {formatMoneyDetailed(displayDailyRate)}
              </Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Hourly rate:</Text>
              <Text style={[styles.rateValue, isPreQuitMode && styles.preQuitNicRateValue]}>
                {displayCurrency}
                {formatMoneyDetailed(displayHourlyRate)}
              </Text>
            </View>
          </View>

          {!isPreQuitMode ? (
            <View style={styles.motivationBanner}>
              <Text style={[styles.motivationText, styles.moneyMotivationText]}>
                {savingsError
                  ? 'Add your quit date in settings to see your results'
                  : displayTotalSaved > 0
                    ? 'Every minute counts! Every alcohol-free day is money back in your bank account. Keep it up!'
                    : 'Your savings will start growing once you quit!'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={20} color={NIC_TEAL} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Every milestone earned, forever.</Text>

          {isPreQuitMode && achievements.length > 0 ? (
            <View style={styles.achievementInfo}>
              <View style={styles.preQuitAchievementsGrid}>
                {achievements.slice(0, 4).map(achievement => (
                  <View key={achievement.id} style={styles.preQuitAchievementCard}>
                    <Text style={styles.preQuitAchievementEmoji}>{achievement.emoji}</Text>
                    <Text style={styles.preQuitAchievementTitle}>{achievement.title}</Text>
                    <Text style={styles.preQuitAchievementDays}>
                      {achievement.daysToGo} {achievement.daysToGo === 1 ? 'day' : 'days'} to go
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[styles.motivationBanner, styles.preQuitExplainerBanner]}>
                <Text style={[styles.motivationText, styles.moneyMotivationText]}>
                  {quitDate
                    ? `Your achievements unlock when you quit on ${format(quitDate, 'MMMM d, yyyy')}. Stay on track and each milestone will mark a real alcohol-free win.`
                    : 'Your achievements unlock when your alcohol-free journey begins. Stay on track and each milestone will mark a real alcohol-free win.'}
                </Text>
              </View>
            </View>
          ) : achievementsLoading ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>Loading...</Text>
              <Text style={styles.achievementDescription}>Please wait</Text>
            </View>
          ) : achievementsError ? (
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>
                {achievementsError === 'future_quit_date' 
                  ? 'Achievements coming soon' 
                  : 'Add your quit date in settings to see your results'
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
                  
                  <View style={styles.achievementCongratsBanner}>
                    <Text style={styles.achievementCongratsText}>
                      {currentAchievementMotivationText}
                    </Text>
                  </View>
                </>
              )}

              {/* Locked day-1 achievement (to match Achievements page UI) */}
              {!achievementStats.currentAchievement &&
                achievementStats.nextAchievement?.id === 'day1' && (
                  <View style={styles.achievementInfo}>
                    <View style={[styles.achievementContainer, styles.lockedAchievementContainer]}>
                      <Text style={[styles.achievementBadge, styles.lockedAchievementBadge]}>
                        {achievementStats.nextAchievement.emoji}
                      </Text>
                      <View style={styles.achievementText}>
                        <Text style={[styles.achievementName, styles.lockedAchievementName]}>
                          {achievementStats.nextAchievement.title}
                        </Text>
                        <Text style={[styles.achievementDescription, styles.lockedAchievementDescription]}>
                          {achievementStats.nextAchievement.daysToGo}{' '}
                          {achievementStats.nextAchievement.daysToGo === 1 ? 'day' : 'days'} to go
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

              {/* Upcoming Achievement */}
              {achievementStats.nextAchievement ? (
                <>
                  <View style={styles.upcomingSection}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => router.push('/achievements')}
                      style={{ flex: 1 }}
                    >
                      <Text style={styles.upcomingTitle}>Upcoming Achievement</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.achievementProgressContainer}>
                      <View
                        style={styles.daysToGoBox}
                      >
                        <Text style={styles.daysToGoNumber}>
                          {achievementStats.daysToNext}
                        </Text>
                        <Text style={styles.daysToGoLabel}>Days to go</Text>
                      </View>
                      
                      <View style={styles.progressSection}>
                        <Text
                          style={styles.upcomingAchievementName}
                        >
                          {achievementStats.nextAchievement.title}
                        </Text>
                        <Text
                          style={styles.upcomingAchievementDescription}
                        >
                          {achievementStats.nextAchievement.description}
                        </Text>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>Progress</Text>
                          <Text
                            style={styles.progressPercentage}
                          >
                            {achievementProgressToNextForHome}%
                          </Text>
                        </View>
                        <View style={styles.achievementProgressBar}>
                          <View
                            style={[
                              styles.achievementProgressFill,
                              { width: `${achievementProgressToNextForHome}%` },
                            ]}
                          />
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

        {/* Financial Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={NIC_TEAL} />
            <Text style={styles.sectionTitle}>Financial Goals</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{"What you're building towards."}</Text>
          
          {activeGoals.length === 0 ? (
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>
                    {goalError ? 'Add your quit date in settings to see your results' : 'No financial goals set'}
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
                    {remaining > 0 && progress < 100 && getGoalEtaText(remaining) && (
                      <View style={styles.goalEtaPill}>
                        <Text style={styles.goalEtaText}>{getGoalEtaText(remaining)}</Text>
                      </View>
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
            <MessageCircle size={20} color={NIC_TEAL} />
            <Text style={styles.sectionTitle}>Remember Your Why</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{"Why you started. Don't forget it."}</Text>
          
          {motivationError || !motivation ? (
            <View style={styles.motivationContainer}>
              <Text style={[styles.motivationText, styles.rememberWhyBodyText]}>
                {motivationError ? 'Add your quit date in settings to see your results' : 'No motivation set yet'}
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
          <Text style={[styles.sectionSubtitle, isPreQuitMode && styles.healthSectionSubtitle]}>
            Based on WHO medical research.
          </Text>

          {healthError ? (
            <View style={styles.timelineContainer}>
              <Text style={styles.timelineDescription}>
                {'Add your quit date in settings to see your results'}
              </Text>
            </View>
          ) : (
            <View style={[styles.timelineContainer, isPreQuitMode && styles.timelineContainerPreQuit]}>
              {isPreQuitMode && (
                <View style={[styles.motivationBanner, styles.healthExplainerBanner]}>
                  <Text style={[styles.motivationText, styles.moneyMotivationText]}>
                    {quitDate
                      ? `Your health recovery begins when you quit on ${format(quitDate, 'MMMM d, yyyy')}. Stay on track and your body can start healing from the first alcohol-free hours.`
                      : 'Your health recovery begins when your alcohol-free journey starts. Stay on track and your body can start healing from the first alcohol-free hours.'}
                  </Text>
                </View>
              )}
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
    backgroundColor: NIC_TEAL,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysNumberLarge: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 56,
  },
  daysText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  timeText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  sinceText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // --- Daily Check-in ---
  checkInHeaderBlock: {
    marginBottom: 14,
  },
  checkInHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  checkInTitleCluster: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  checkInSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInSectionTitle: {
    marginBottom: 0,
  },
  checkInSubtitleLines: {
    marginTop: 6,
    paddingLeft: 28,
    paddingRight: 8,
    alignSelf: 'stretch',
    gap: 4,
    flexShrink: 1,
  },
  checkInSectionSubtitleLine: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 19,
    fontWeight: '500',
  
},
  streakBadgeCol: {
    alignItems: 'flex-end',
  },
  streakPill: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.14)',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  streakFire: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 28,
    lineHeight: 32,
    marginRight: 2,
  
},
  streakCountBlack: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
    lineHeight: 30,
  
},
  streakSlashOutOf: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    paddingBottom: 1,
    marginLeft: 1,
  
},
  streakCaption: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: NIC_TEAL,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 6,
    letterSpacing: 0.2,
  
},
  checkinFormSurface: {
    backgroundColor: 'rgba(3, 4, 94, 0.055)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
  },
  checkInQuestion: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
    letterSpacing: -0.2,
  
},
  checkInQuestionSecond: {
    marginTop: 20,
    marginBottom: 10,
  },
  checkinSegmentTray: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(60, 60, 67, 0.07)',
    borderRadius: 14,
    padding: 4,
  },
  checkinSegmentHairline: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
    alignSelf: 'stretch',
    marginVertical: 8,
  },
  moodOptionInRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 11,
    backgroundColor: 'transparent',
  },
  moodOptionSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  moodEmoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 26,
    marginBottom: 6,
  
},
  moodEmojiSelected: {
    transform: [{ scale: 1.06 }],
  },
  moodLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: '#636366',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  
},
  moodLabelSelected: {
    color: NIC_TEAL,
  },
  checkinDrinkButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: 'transparent',
  },
  checkinDrinkEmoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 24,
    marginRight: 8,
  
},
  checkinDrinkButtonCleanOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: NIC_TEAL,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  checkinDrinkButtonDrankOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF6B47',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  checkinDrinkButtonLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '700',
    color: '#3A3A3C',
    letterSpacing: -0.2,
  
},
  checkinDrinkButtonLabelCleanOn: {
    color: NIC_TEAL,
  },
  checkinDrinkButtonLabelDrankOn: {
    color: '#E85A3A',
  },
  checkInAnsweredBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  badgeClean: {
    backgroundColor: 'rgba(3, 4, 94, 0.1)',
    borderColor: 'rgba(3, 4, 94, 0.28)',
  },
  badgeDrank: {
    backgroundColor: 'rgba(255,107,71,0.1)',
    borderColor: 'rgba(255,107,71,0.3)',
  },
  checkInAnsweredText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  
},
  badgeCleanText: {
    color: NIC_TEAL,
  },
  badgeDrankText: {
    color: '#FF6B47',
  },
  checkinDoneCard: {
    backgroundColor: 'rgba(3, 4, 94, 0.055)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.12)',
  },
  checkinDoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  checkinDoneTitle: {
    fontFamily: FONT_FAMILY_UI,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  
},
  checkinChangeLink: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '600',
    color: NIC_TEAL,
  
},
  checkInDoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
    flexWrap: 'wrap',
  },
  checkInMoodBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(3, 4, 94, 0.06)',
    borderColor: 'rgba(3, 4, 94, 0.2)',
  },
  checkInMoodBadgeText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: NIC_TEAL,
  
},
  checkInEncouragement: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 0,
    lineHeight: 20,
    textAlign: 'left',
  
},
  checkinFeedbackBanner: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  checkinFeedbackBannerClean: {
    backgroundColor: 'rgba(3, 4, 94, 0.1)',
    borderColor: 'rgba(3, 4, 94, 0.26)',
  },
  checkinFeedbackBannerDrank: {
    backgroundColor: 'rgba(255,107,71,0.1)',
    borderColor: 'rgba(255,107,71,0.26)',
  },
  checkInEncouragementClean: {
    color: NIC_TEAL,
  },
  checkInEncouragementDrank: {
    color: '#C24A32',
  },
  checkinWeekPanel: {
    marginTop: 14,
  },
  checkinSubsectionTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  checkinWeekCard: {
    backgroundColor: 'rgba(3, 4, 94, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  checkinDotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  checkinDotCell: {
    flex: 1,
    alignItems: 'center',
  },
  checkinDotWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  checkinDotWrapToday: {
    borderWidth: 2,
    borderColor: 'rgba(3, 4, 94, 0.35)',
  },
  checkinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  checkinDotEmpty: {
    backgroundColor: 'rgba(60, 60, 67, 0.18)',
  },
  checkinDotClean: {
    backgroundColor: NIC_TEAL,
  },
  checkinDotDrank: {
    backgroundColor: '#FF6B47',
  },
  checkinDotLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  
},
  checkinDotLabelToday: {
    color: NIC_TEAL,
  },
  checkinLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  checkinLegendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(60, 60, 67, 0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  checkinLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkinLegendDotClean: {
    backgroundColor: NIC_TEAL,
  },
  checkinLegendDotDrank: {
    backgroundColor: '#FF6B47',
  },
  checkinLegendDotEmpty: {
    backgroundColor: 'rgba(60, 60, 67, 0.22)',
  },
  checkinLegendChipText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    fontWeight: '600',
    color: '#636366',
  
},
  checkinStatsGrid: {
    marginTop: 12,
  },
  checkinStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  checkinStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  checkinStatIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkinStatIconNavy: {
    backgroundColor: 'rgba(3, 4, 94, 0.1)',
  },
  checkinStatCardValue: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  
},
  checkinStatCardDenom: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  
},
  checkinStatCardLabel: {
    fontFamily: FONT_FAMILY_UI,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    lineHeight: 16,
  
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
    lineHeight: 20,
  },
  healthSectionSubtitle: {
    marginBottom: 12,
  },
  moneyAmount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 36,
    fontWeight: '700',
    color: NIC_TEAL,
    marginBottom: 20,
  },
  moneyAmountLarge: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 28,
  
},
  ratesContainer: {
    marginBottom: 20,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rateDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  rateLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
  
},
  rateValue: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: NIC_TEAL,
  
},
  motivationBanner: {
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.2)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: NIC_TEAL,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
    textAlign: 'left',
  
},
  moneyMotivationText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  
},
  preQuitNicStreakPill: {
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderColor: 'rgba(3, 4, 94, 0.14)',
  },
  preQuitHealthSectionMuted: {
    opacity: 0.72,
  },
  vapeTrackerStreakBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  preQuitNicMoneyAmount: {
    color: NIC_TEAL,
  },
  preQuitNicRateValue: {
    color: NIC_TEAL,
  },
  preQuitNicMotivationText: {
    color: NIC_TEAL,
  },
  preQuitMoneyFootnote: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    lineHeight: 18,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: -8,
    marginBottom: 18,
  },
  preQuitMoneyRatesHeading: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  motivationBannerPreQuitMoney: {
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.2)',
    marginBottom: 16,
  },
  preQuitExplainerBanner: {
    marginTop: 12,
    marginBottom: 12,
  },
  healthExplainerBanner: {
    marginTop: 0,
    marginBottom: 16,
  },
  lockedAchievementContainer: {
    marginTop: 8,
    opacity: 0.7,
  },
  lockedAchievementBadge: {
    opacity: 0.5,
  },
  lockedAchievementHint: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  preQuitAchievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  preQuitAchievementCard: {
    width: '48.5%',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#ECECEE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    opacity: 0.72,
  },
  preQuitAchievementEmoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 22,
    marginBottom: 8,
  },
  preQuitAchievementTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#636366',
    textAlign: 'center',
    marginBottom: 3,
  },
  preQuitAchievementDays: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  preQuitCard: {
    marginTop: 14,
    backgroundColor: 'rgba(3, 4, 94, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.16)',
    padding: 12,
  },
  preQuitTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  preQuitSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#636366',
    marginBottom: 6,
    lineHeight: 20,
  },
  preQuitProgress: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: NIC_TEAL,
    fontWeight: '700',
    marginBottom: 10,
  },
  preQuitCongratsBanner: {
    backgroundColor: 'rgba(3, 4, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.24)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  preQuitCongratsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  preQuitCongratsText: {
    flex: 1,
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: NIC_TEAL,
    fontWeight: '600',
    lineHeight: 20,
  },
  preQuitEditButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.36)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  preQuitEditButtonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: NIC_TEAL,
    fontWeight: '700',
  },
  preQuitChecklist: {
    gap: 8,
  },
  preQuitChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.2)',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  preQuitChecklistItemDone: {
    backgroundColor: 'rgba(3, 4, 94, 0.1)',
    borderColor: 'rgba(3, 4, 94, 0.32)',
  },
  preQuitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: NIC_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  preQuitCheckboxDone: {
    backgroundColor: NIC_TEAL,
  },
  preQuitCheckboxTick: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  preQuitChecklistLabel: {
    flex: 1,
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  preQuitChecklistLabelDone: {
    color: NIC_TEAL,
    fontWeight: '600',
  },
  preQuitPrepStreakPanel: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(3, 4, 94, 0.18)',
  },
  preQuitPrepLegendRow: {
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
  },
  preQuitPrepLegendChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 0,
  },
  preQuitPrepLegendChipText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  preQuitNicWeekCard: {
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  preQuitNicDotRow: {
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  preQuitNicDotCell: {
    gap: 10,
  },
  preQuitNicDotWrap: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  preQuitNicDotWrapToday: {
    borderColor: 'rgba(3, 4, 94,0.5)',
    backgroundColor: 'rgba(3, 4, 94,0.06)',
  },
  preQuitNicDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  preQuitNicDotEmpty: {
    backgroundColor: '#D8D8DC',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  preQuitNicDotComplete: {
    backgroundColor: NIC_TEAL,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  preQuitNicDotLabelToday: {
    color: NIC_TEAL,
  },
  preQuitNicLegendDotComplete: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: NIC_TEAL,
  },
  preQuitNicLegendDotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
  },
  puffCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.22)',
    backgroundColor: 'rgba(3, 4, 94, 0.06)',
    padding: 12,
  },
  puffCardInSection: {
    marginTop: 0,
  },
  vapeTrackerEaseBackHint: {
    marginTop: 14,
    marginBottom: 6,
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    lineHeight: 20,
    textAlign: 'center',
  },
  vapeTrackerWeekSummary: {
    marginTop: 0,
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '500',
    color: '#636366',
    lineHeight: 20,
    textAlign: 'center',
  },
  puffLogVapeCircle: {
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: NIC_TEAL,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 4,
    shadowColor: NIC_TEAL,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 10,
  },
  puffLogVapeCircleText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 14,
  },
  puffUndoColumn: {
    marginTop: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  puffUndoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puffUndoButtonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    color: NIC_TEAL,
    marginTop: -2,
  },
  puffUndoHint: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: FONT_FAMILY_UI,
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  puffWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  puffDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  puffBarTrack: {
    width: 14,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#F1F2F4',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 4,
  },
  puffBarFill: {
    width: '100%',
    borderRadius: 7,
    backgroundColor: 'rgba(3, 4, 94,0.4)',
    minHeight: 6,
  },
  puffBarFillToday: {
    backgroundColor: NIC_TEAL,
  },
  puffBarFillUp: {
    backgroundColor: '#E04D3D',
  },
  puffDayCount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  puffDayCountToday: {
    color: NIC_TEAL,
  },
  puffDayCountUp: {
    color: '#C23B2E',
  },
  puffDayLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 2,
  },
  puffDayLabelToday: {
    color: NIC_TEAL,
  },
  rememberWhyBodyText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 48,
    marginRight: 16,
  
},
  achievementText: {
    flex: 1,
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
    color: NIC_TEAL,
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
  upcomingAchievementLabels: {
    marginBottom: 12,
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
  lockedAchievementName: {
    color: '#8E8E93',
  },
  lockedAchievementDescription: {
    color: '#AEAEB2',
    marginBottom: 0,
  },
  daysToGoBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: NIC_TEAL,
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
    color: NIC_TEAL,
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
    color: NIC_TEAL,
  
},
  achievementProgressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: NIC_TEAL,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  
},
  goalAmount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: NIC_TEAL,
  
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
    backgroundColor: NIC_TEAL,
    borderRadius: 4,
  },
  progressPercent: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    color: NIC_TEAL,
  
},
  viewAllButton: {
    backgroundColor: NIC_TEAL,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: NIC_TEAL,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  
},
  timelineContainer: {
    marginTop: 16,
  },
  timelineContainerPreQuit: {
    marginTop: 0,
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
    borderColor: NIC_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineEmoji: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
  
},
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: NIC_TEAL,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    fontWeight: '600',
    color: NIC_TEAL,
    letterSpacing: 0.5,
  
},
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: NIC_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  
},
  timelineDescription: {
    fontFamily: FONT_FAMILY_UI,
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
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.08)',
  },
  customReasonTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  
},
  customReasonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    fontStyle: 'italic',
  
},
  goalsContainer: {
    marginBottom: 16,
  },
  goalsTitle: {
    fontFamily: FONT_FAMILY_UI,
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
    backgroundColor: NIC_TEAL,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalTagText: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    fontWeight: '700',
    color: NIC_TEAL,
  
},

  goalDescription: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    fontWeight: '600',
    color: NIC_TEAL,
  
},
  remainingText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: NIC_TEAL,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  
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
    color: NIC_TEAL,
    textAlign: 'left',
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
    flexWrap: 'wrap',
  
},
  achievedBanner: {
    backgroundColor: 'rgba(3, 4, 94, 0.08)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.15)',
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
    color: NIC_TEAL,
  
},

  // Test button styles
  testButton: {
    backgroundColor: NIC_TEAL,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: NIC_TEAL,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  
},
  testButtonHelper: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  
},

});