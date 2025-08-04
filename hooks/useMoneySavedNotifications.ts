import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMoneySaved } from './useMoneySaved';
import { useNotifications } from '@/contexts/NotificationContext';

const STORAGE_KEY = 'money-saved-notifications-sent';

// Define major money saved milestones to avoid spamming users
const MONEY_MILESTONES = [
  100, 500, 1000, 2000, 3000, 4000, 5000, 7500, 10000, 
  15000, 20000, 25000, 30000, 40000, 50000
];

export function useMoneySavedNotifications() {
  const { totalSaved, currency, loading, error } = useMoneySaved();
  const { sendMoneySavedNotification } = useNotifications();
  const previousMilestonesRef = useRef<number[]>([]);

  useEffect(() => {
    if (loading || error || error === 'future_quit_date') return;

    const checkForMilestones = async () => {
      try {
        // Get previously notified milestones
        const storedNotified = await AsyncStorage.getItem(STORAGE_KEY);
        const previouslyNotified = storedNotified ? JSON.parse(storedNotified) : [];
        
        // Find all milestones that have been reached
        const reachedMilestones = MONEY_MILESTONES.filter(milestone => totalSaved >= milestone);
        
        // Find new milestones (reached now but not previously notified)
        const newMilestones = reachedMilestones.filter(
          milestone => !previouslyNotified.includes(milestone)
        );

        // Send notifications for new milestones
        for (const milestone of newMilestones) {
          await sendMoneySavedNotification(milestone, currency);
        }

        // Update storage with all reached milestones
        if (newMilestones.length > 0) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reachedMilestones));
        }

          } catch (error) {
      // Silent error handling
    }
    };

    checkForMilestones();
  }, [totalSaved, currency, loading, error, sendMoneySavedNotification]);

  // Function to reset notification history (useful for testing)
  const resetNotificationHistory = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Money saved notification history reset');
    } catch (error) {
      console.log('Error resetting money saved notification history:', error);
    }
  };

  // Function to get next milestone
  const getNextMilestone = (): number | null => {
    const nextMilestone = MONEY_MILESTONES.find(milestone => totalSaved < milestone);
    return nextMilestone || null;
  };

  // Function to get progress to next milestone
  const getProgressToNextMilestone = (): { amount: number; percentage: number } | null => {
    const nextMilestone = getNextMilestone();
    if (!nextMilestone) return null;

    const previousMilestone = MONEY_MILESTONES.find(
      (milestone, index) => 
        MONEY_MILESTONES[index + 1] === nextMilestone
    ) || 0;

    const progressAmount = totalSaved - previousMilestone;
    const milestoneRange = nextMilestone - previousMilestone;
    const percentage = milestoneRange > 0 ? (progressAmount / milestoneRange) * 100 : 0;

    return {
      amount: nextMilestone - totalSaved,
      percentage: Math.min(100, Math.max(0, percentage))
    };
  };

  return {
    resetNotificationHistory,
    getNextMilestone,
    getProgressToNextMilestone,
    totalMilestones: MONEY_MILESTONES.length,
    achievedMilestones: MONEY_MILESTONES.filter(milestone => totalSaved >= milestone).length,
  };
} 