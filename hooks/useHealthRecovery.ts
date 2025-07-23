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

// WHO-based health recovery milestones for vaping cessation
const HEALTH_MILESTONES: Omit<HealthMilestone, 'achieved'>[] = [
  {
    id: '20min',
    timeValue: 20,
    timeDisplay: '20 MINUTES',
    title: 'Heart rate normalizes',
    description: 'Heart rate and blood pressure drop to normal levels',
    icon: '❤️',
    iconType: 'heart',
    iconColor: '#FF69B4',
  },
  {
    id: '12hours',
    timeValue: 12 * 60, // 12 hours in minutes
    timeDisplay: '12 HOURS',
    title: 'Carbon monoxide clears',
    description: 'Carbon monoxide level in blood normalizes, oxygen levels increase',
    icon: '🫁',
    iconType: 'emoji',
  },
  {
    id: '1day',
    timeValue: 24 * 60, // 1 day in minutes
    timeDisplay: '1 DAY',
    title: 'Heart attack risk drops',
    description: 'Risk of heart attack begins to decrease',
    icon: '❤️',
    iconType: 'heart',
    iconColor: '#FF4757',
  },
  {
    id: '2days',
    timeValue: 2 * 24 * 60, // 2 days in minutes
    timeDisplay: '2 DAYS',
    title: 'Nerve endings regrow',
    description: 'Damaged nerve endings start to regrow, taste and smell improve',
    icon: '🔔',
    iconType: 'emoji',
  },
  {
    id: '3days',
    timeValue: 3 * 24 * 60, // 3 days in minutes
    timeDisplay: '3 DAYS',
    title: 'Nicotine withdrawal peaks',
    description: 'Nicotine is completely out of your system, lung capacity increases',
    icon: '🧠',
    iconType: 'emoji',
  },
  {
    id: '1week',
    timeValue: 7 * 24 * 60, // 1 week in minutes
    timeDisplay: '1 WEEK',
    title: 'Circulation improves',
    description: 'Blood circulation improves significantly',
    icon: '🩸',
    iconType: 'emoji',
  },
  {
    id: '2weeks',
    timeValue: 14 * 24 * 60, // 2 weeks in minutes
    timeDisplay: '2 WEEKS',
    title: 'Lung function increases',
    description: 'Lung function begins to improve, coughing and shortness of breath decrease',
    icon: '🫁',
    iconType: 'emoji',
  },
  {
    id: '1month',
    timeValue: 30 * 24 * 60, // 1 month in minutes
    timeDisplay: '1 MONTH',
    title: 'Cilia regrow',
    description: 'Cilia in lungs regrow, reducing infection risk and clearing mucus',
    icon: '🌿',
    iconType: 'emoji',
  },
  {
    id: '3months',
    timeValue: 90 * 24 * 60, // 3 months in minutes
    timeDisplay: '3 MONTHS',
    title: 'Circulation normalizes',
    description: 'Circulation and lung function significantly improve',
    icon: '💨',
    iconType: 'emoji',
  },
  {
    id: '9months',
    timeValue: 270 * 24 * 60, // 9 months in minutes
    timeDisplay: '9 MONTHS',
    title: 'Lung healing accelerates',
    description: 'Lung capacity increases by up to 10%, reducing cough and shortness of breath',
    icon: '🌱',
    iconType: 'emoji',
  },
  {
    id: '1year',
    timeValue: 365 * 24 * 60, // 1 year in minutes
    timeDisplay: '1 YEAR',
    title: 'Heart disease risk halved',
    description: 'Risk of coronary heart disease is cut in half compared to a smoker',
    icon: '❤️',
    iconType: 'heart',
    iconColor: '#35998d',
  },
  {
    id: '5years',
    timeValue: 5 * 365 * 24 * 60, // 5 years in minutes
    timeDisplay: '5 YEARS',
    title: 'Stroke risk normalizes',
    description: 'Risk of stroke drops to that of a non-smoker',
    icon: '🧠',
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