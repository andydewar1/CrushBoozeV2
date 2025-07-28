import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAchievements } from './useAchievements';
import { useNotifications } from '@/contexts/NotificationContext';

const STORAGE_KEY = 'achievement-notifications-sent';

export function useAchievementNotifications() {
  const { achievements, stats, loading, error } = useAchievements();
  const { sendAchievementNotification } = useNotifications();
  const previousAchievementsRef = useRef<string[]>([]);

  useEffect(() => {
    if (loading || error) return;

    const checkForNewAchievements = async () => {
      try {
        // Get previously notified achievements
        const storedNotified = await AsyncStorage.getItem(STORAGE_KEY);
        const previouslyNotified = storedNotified ? JSON.parse(storedNotified) : [];
        
        // Get currently achieved achievements
        const currentlyAchieved = achievements
          .filter(achievement => achievement.achieved)
          .map(achievement => achievement.id);

        // Find new achievements (achieved now but not previously notified)
        const newAchievements = currentlyAchieved.filter(
          achievementId => !previouslyNotified.includes(achievementId)
        );

        // Send notifications for new achievements
        for (const achievementId of newAchievements) {
          const achievement = achievements.find(a => a.id === achievementId);
          if (achievement) {
            await sendAchievementNotification(
              achievement.title,
              achievement.description,
              achievement.emoji
            );
          }
        }

        // Update storage with all currently achieved achievements
        if (newAchievements.length > 0) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentlyAchieved));
        }

      } catch (error) {
        console.log('Error checking for new achievements:', error);
      }
    };

    checkForNewAchievements();
  }, [achievements, loading, error, sendAchievementNotification]);

  // Function to reset notification history (useful for testing)
  const resetNotificationHistory = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Achievement notification history reset');
    } catch (error) {
      console.log('Error resetting notification history:', error);
    }
  };

  return {
    resetNotificationHistory,
  };
} 