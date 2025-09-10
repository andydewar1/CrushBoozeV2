import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAchievements } from './useAchievements';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewPrompt } from './useReviewPrompt';

const STORAGE_KEY = 'achievement-notifications-sent';

export function useAchievementNotifications() {
  const { achievements, loading, error } = useAchievements();
  const { sendAchievementNotification, sendAchievementCheckNotification } = useNotifications();
  const { user } = useAuth();
  const previousAchievementsRef = useRef<string[]>([]);
  
  // Trigger review prompt check
  useReviewPrompt();

  useEffect(() => {
    console.log('🔔 ACHIEVEMENT NOTIFICATIONS HOOK:', {
      loading,
      error: error,
      hasUser: !!user,
      userId: user?.id,
      achievementsLength: achievements.length,
      achievements: achievements.slice(0, 3).map(a => ({
        id: a.id,
        title: a.title,
        achieved: a.achieved,
        daysRequired: a.daysRequired
      }))
    });

    if (loading || error || !user || !achievements.length) return;

    const checkForNewAchievements = async () => {
      try {
        // Get previously notified achievements for this user
        const storedNotified = await AsyncStorage.getItem(`${STORAGE_KEY}-${user.id}`);
        const previouslyNotified = storedNotified ? JSON.parse(storedNotified) : [];
        
        // Get currently achieved achievements
        const currentlyAchieved = achievements
          .filter(achievement => achievement.achieved)
          .map(achievement => achievement.id);

        // Find new achievements (achieved now but not previously notified)
        const newAchievements = currentlyAchieved.filter(
          achievementId => !previouslyNotified.includes(achievementId)
        );

        console.log('🏆 Achievement check:', {
          currentlyAchieved: currentlyAchieved.length,
          previouslyNotified: previouslyNotified.length,
          newAchievements: newAchievements.length
        });

        // Send notifications for ALL new achievements - SIMPLE!
        if (newAchievements.length > 0) {
          for (const achievementId of newAchievements) {
            const achievement = achievements.find(a => a.id === achievementId);
            if (achievement) {
              console.log('🎉 NEW ACHIEVEMENT UNLOCKED - SENDING NOTIFICATION:', achievement.title);
              
              // Send foreground notification
              await sendAchievementNotification(
                achievement.title,
                achievement.description,
                achievement.emoji
              );
              
              // Send background notification  
              console.log('🔕 Triggering background achievement notification');
              await sendAchievementCheckNotification();
            }
          }

          // Update storage with all currently achieved achievements
          await AsyncStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(currentlyAchieved));
          console.log('💾 Updated notification storage with', currentlyAchieved.length, 'achievements');
        }

      } catch (error) {
        console.error('❌ Error in achievement notifications:', error);
      }
    };

    checkForNewAchievements();
  }, [achievements, loading, error, sendAchievementNotification, sendAchievementCheckNotification, user]);

  // Function to reset notification history (useful for testing)
  const resetNotificationHistory = async () => {
    try {
      if (user) {
        await AsyncStorage.removeItem(`${STORAGE_KEY}-${user.id}`);
        console.log('🧹 Achievement notification history reset for user:', user.id);
      }
    } catch (error) {
      console.log('❌ Error resetting notification history:', error);
    }
  };

  return {
    resetNotificationHistory,
  };
} 