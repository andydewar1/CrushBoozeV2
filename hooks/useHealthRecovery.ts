import { useState, useEffect } from 'react';
import { useQuitTimer } from './useQuitTimer';

export interface HealthMilestone {
  id: string;
  timeValue: number; // in minutes for calculation
  timeDisplay: string; // display text like "20 MINUTES"
  title: string;
  description: string;
  icon: string; // emoji or icon identifier
  iconType: 'emoji' | 'heart' | 'lungs';
  iconColor?: string;
  achieved: boolean;
}

// Health recovery milestones for alcohol cessation
const HEALTH_MILESTONES: Omit<HealthMilestone, 'achieved'>[] = [
  {
    id: '8hours',
    timeValue: 8 * 60, // 8 hours in minutes
    timeDisplay: '8 HOURS',
    title: 'Blood alcohol clears',
    description: 'Alcohol is fully metabolized and leaves your bloodstream',
    icon: '🩸',
    iconType: 'emoji',
  },
  {
    id: '24hours',
    timeValue: 24 * 60, // 24 hours in minutes
    timeDisplay: '24 HOURS',
    title: 'Blood sugar stabilizes',
    description: 'Blood sugar levels begin to normalize, energy improves',
    icon: '⚡',
    iconType: 'emoji',
  },
  {
    id: '48hours',
    timeValue: 48 * 60, // 48 hours in minutes
    timeDisplay: '48 HOURS',
    title: 'Hydration restored',
    description: 'Body rehydrates fully, headaches and fatigue decrease',
    icon: '💧',
    iconType: 'emoji',
  },
  {
    id: '3days',
    timeValue: 3 * 24 * 60, // 3 days in minutes
    timeDisplay: '3 DAYS',
    title: 'Withdrawal eases',
    description: 'Acute withdrawal symptoms begin to subside',
    icon: '🧠',
    iconType: 'emoji',
  },
  {
    id: '1week',
    timeValue: 7 * 24 * 60, // 1 week in minutes
    timeDisplay: '1 WEEK',
    title: 'Sleep improves',
    description: 'Sleep quality and REM cycles begin to normalize',
    icon: '😴',
    iconType: 'emoji',
  },
  {
    id: '2weeks',
    timeValue: 14 * 24 * 60, // 2 weeks in minutes
    timeDisplay: '2 WEEKS',
    title: 'Liver begins healing',
    description: 'Liver starts to repair, digestion and nutrient absorption improve',
    icon: '🫀',
    iconType: 'emoji',
  },
  {
    id: '1month',
    timeValue: 30 * 24 * 60, // 1 month in minutes
    timeDisplay: '1 MONTH',
    title: 'Brain fog lifts',
    description: 'Mental clarity improves, mood stabilizes significantly',
    icon: '🧠',
    iconType: 'emoji',
  },
  {
    id: '3months',
    timeValue: 90 * 24 * 60, // 3 months in minutes
    timeDisplay: '3 MONTHS',
    title: 'Liver fat reduces',
    description: 'Liver fat can reduce by up to 15%, blood pressure normalizes',
    icon: '❤️',
    iconType: 'heart',
    iconColor: '#FF69B4',
  },
  {
    id: '6months',
    timeValue: 180 * 24 * 60, // 6 months in minutes
    timeDisplay: '6 MONTHS',
    title: 'Skin transforms',
    description: 'Skin dramatically improves, looking healthier and more hydrated',
    icon: '✨',
    iconType: 'emoji',
  },
  {
    id: '1year',
    timeValue: 365 * 24 * 60, // 1 year in minutes
    timeDisplay: '1 YEAR',
    title: 'Liver recovery',
    description: 'Liver function can return to normal, overall health significantly improved',
    icon: '🎉',
    iconType: 'emoji',
  },
  {
    id: '2years',
    timeValue: 2 * 365 * 24 * 60, // 2 years in minutes
    timeDisplay: '2 YEARS',
    title: 'Heart disease risk drops',
    description: 'Risk of heart disease significantly reduced',
    icon: '❤️',
    iconType: 'heart',
    iconColor: '#03045e',
  },
  {
    id: '5years',
    timeValue: 5 * 365 * 24 * 60, // 5 years in minutes
    timeDisplay: '5 YEARS',
    title: 'Long-term health gains',
    description: 'Risk of liver disease, stroke, and certain cancers significantly reduced',
    icon: '🏆',
    iconType: 'emoji',
  },
];

export function useHealthRecovery() {
  const [milestones, setMilestones] = useState<HealthMilestone[]>([]);
  const [displayMilestones, setDisplayMilestones] = useState<HealthMilestone[]>([]);
  const { days, hours, minutes, loading: timerLoading, error: timerError } = useQuitTimer();

  useEffect(() => {
    if (timerLoading || timerError) return;

    // Calculate total minutes since quit
    const totalMinutesSinceQuit = (days * 24 * 60) + (hours * 60) + minutes;

    // Mark milestones as achieved based on time since quit
    const updatedMilestones = HEALTH_MILESTONES.map(milestone => ({
      ...milestone,
      achieved: totalMinutesSinceQuit >= milestone.timeValue,
    }));

    setMilestones(updatedMilestones);

    // Create display array: 3 achieved + 3 upcoming
    const achievedMilestones = updatedMilestones.filter(m => m.achieved);
    const upcomingMilestones = updatedMilestones.filter(m => !m.achieved);

    // Take last 3 achieved (most recent) and first 3 upcoming
    const lastThreeAchieved = achievedMilestones.slice(-3);
    const nextThreeUpcoming = upcomingMilestones.slice(0, 3);

    // If we have fewer than 3 achieved, pad with more upcoming
    const totalToShow = 6;
    let displayArray = [...lastThreeAchieved, ...nextThreeUpcoming];
    
    // If we have more than 6, trim to 6
    if (displayArray.length > totalToShow) {
      // Prioritize showing achieved milestones
      if (lastThreeAchieved.length >= 3) {
        displayArray = [...lastThreeAchieved, ...nextThreeUpcoming.slice(0, 3)];
      } else {
        displayArray = displayArray.slice(0, totalToShow);
      }
    }

    setDisplayMilestones(displayArray);
  }, [days, hours, minutes, timerLoading, timerError]);

  return {
    milestones: displayMilestones,
    loading: timerLoading,
    error: timerError,
    totalAchieved: milestones.filter(m => m.achieved).length,
    totalMilestones: HEALTH_MILESTONES.length,
  };
} 