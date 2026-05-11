import { useState, useEffect } from 'react';
import { useQuitTimer } from './useQuitTimer';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  daysRequired: number;
  achieved: boolean;
  daysToGo: number;
}

export interface AchievementStats {
  totalEarned: number;
  daysFree: number;
  totalToGo: number;
  currentAchievement: Achievement | null;
  nextAchievement: Achievement | null;
  progressToNext: number; // percentage
  daysToNext: number;
}

// Complete achievement milestones from 1 day to 5 years
const ACHIEVEMENTS: Omit<Achievement, 'achieved' | 'daysToGo'>[] = [
  {
    id: 'day1',
    title: 'First Day',
    description: 'You took the first step',
    emoji: '🎯',
    daysRequired: 1,
  },
  {
    id: 'day3',
    title: '3 Day Warrior',
    description: 'Withdrawal symptoms easing',
    emoji: '⚡',
    daysRequired: 3,
  },
  {
    id: 'week1',
    title: 'First Week',
    description: '7 days alcohol-free',
    emoji: '🌟',
    daysRequired: 7,
  },
  {
    id: 'week2',
    title: '2 Week Champion',
    description: 'Liver beginning to heal',
    emoji: '🏃',
    daysRequired: 14,
  },
  {
    id: 'week3',
    title: '3 Week Hero',
    description: 'Building strong habits',
    emoji: '🦸',
    daysRequired: 21,
  },
  {
    id: 'month1',
    title: 'First Month',
    description: '30 days of freedom',
    emoji: '🏆',
    daysRequired: 30,
  },
  {
    id: 'month2',
    title: '2 Month Warrior',
    description: '60 days of clarity',
    emoji: '⚔️',
    daysRequired: 60,
  },
  {
    id: 'month3',
    title: '3 Month Titan',
    description: 'Liver fat reducing',
    emoji: '🛡️',
    daysRequired: 90,
  },
  {
    id: 'month4',
    title: '4 Month Guardian',
    description: 'Blood pressure normalizing',
    emoji: '🌿',
    daysRequired: 120,
  },
  {
    id: 'month5',
    title: '5 Month Master',
    description: 'Major health improvements',
    emoji: '💪',
    daysRequired: 150,
  },
  {
    id: 'month6',
    title: '6 Month Champion',
    description: 'Half year sober',
    emoji: '👑',
    daysRequired: 180,
  },
  {
    id: 'month7',
    title: '7 Month Legend',
    description: 'Mental clarity soaring',
    emoji: '🌊',
    daysRequired: 210,
  },
  {
    id: 'month8',
    title: '8 Month Elite',
    description: 'Energy levels restored',
    emoji: '💨',
    daysRequired: 240,
  },
  {
    id: 'month9',
    title: '9 Month Sage',
    description: 'Sleep quality transformed',
    emoji: '🌱',
    daysRequired: 270,
  },
  {
    id: 'month10',
    title: '10 Month Veteran',
    description: 'Almost a full year',
    emoji: '🎖️',
    daysRequired: 300,
  },
  {
    id: 'month11',
    title: '11 Month Pioneer',
    description: 'Final stretch to one year',
    emoji: '🚀',
    daysRequired: 330,
  },
  {
    id: 'year1',
    title: '1 Year Legend',
    description: 'Liver function restored',
    emoji: '🏅',
    daysRequired: 365,
  },
  {
    id: 'year2',
    title: '2 Year Master',
    description: 'Heart disease risk dropping',
    emoji: '💎',
    daysRequired: 730,
  },
  {
    id: 'year3',
    title: '3 Year Sage',
    description: 'Long-term health gains',
    emoji: '🌟',
    daysRequired: 1095,
  },
  {
    id: 'year4',
    title: '4 Year Elite',
    description: 'Cancer risk reduced',
    emoji: '💫',
    daysRequired: 1460,
  },
  {
    id: 'year5',
    title: '5 Year Immortal',
    description: 'Ultimate health achievement',
    emoji: '👑',
    daysRequired: 1825,
  },
];

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats>({
    totalEarned: 0,
    daysFree: 0,
    totalToGo: 0,
    currentAchievement: null,
    nextAchievement: null,
    progressToNext: 0,
    daysToNext: 0,
  });
  const { days, hours, minutes, loading: timerLoading, error: timerError } = useQuitTimer();
  const isFutureQuitDate = timerError === 'future_quit_date';

  useEffect(() => {
    if (timerLoading || (timerError && !isFutureQuitDate)) return;

    // CrushNic: full calendar days until quit (ceil), then add sober days for each badge
    // (e.g. quit in 3 days → First Day badge in 3 + 1 = 4 days).
    const daysUntilQuit = isFutureQuitDate
      ? days + (hours > 0 || minutes > 0 ? 1 : 0)
      : 0;
    const progressDays = isFutureQuitDate ? -daysUntilQuit : days;
    const daysFree = Math.max(0, progressDays);

    const processedAchievements = ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      achieved: progressDays >= achievement.daysRequired,
      daysToGo: isFutureQuitDate
        ? achievement.daysRequired + daysUntilQuit
        : Math.max(0, achievement.daysRequired - progressDays),
    }));

    const earnedAchievements = processedAchievements.filter(a => a.achieved);
    const unlockedAchievements = processedAchievements.filter(a => !a.achieved);

    const currentAchievement =
      earnedAchievements.length > 0 ? earnedAchievements[earnedAchievements.length - 1] : null;
    const nextAchievement = unlockedAchievements[0] || null;

    let progressToNext = 0;
    let daysToNext = 0;

    if (nextAchievement) {
      const targetDays = nextAchievement.daysRequired;
      const currentDays = Math.max(0, progressDays);
      progressToNext = targetDays > 0 ? Math.min(100, (currentDays / targetDays) * 100) : 0;
      daysToNext = nextAchievement.daysToGo;
    } else {
      progressToNext = 100;
      daysToNext = 0;
    }

    setAchievements(processedAchievements);
    setStats({
      totalEarned: earnedAchievements.length,
      daysFree,
      totalToGo: unlockedAchievements.length,
      currentAchievement,
      nextAchievement,
      progressToNext: Math.round(progressToNext),
      daysToNext,
    });
  }, [days, hours, minutes, timerLoading, timerError, isFutureQuitDate]);

  return {
    achievements,
    stats,
    loading: timerLoading,
    error: isFutureQuitDate ? null : timerError,
  };
}
