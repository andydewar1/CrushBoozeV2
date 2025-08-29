import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAchievements } from './useAchievements';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewPrompt } from './useReviewPrompt';

const STORAGE_KEY = 'achievement-notifications-sent';
const SIGNUP_DATE_KEY = 'user-signup-date';

export function useAchievementNotifications() {
  const { achievements, stats, loading, error } = useAchievements();
  const { sendAchievementNotification, sendAchievementCheckNotification } = useNotifications();
  const { user } = useAuth();
  const previousAchievementsRef = useRef<string[]>([]);
  
  // Trigger review prompt check (based on signup date, not achievements)
  useReviewPrompt();

  // Store signup date when user first signs up
  useEffect(() => {
    const storeSignupDate = async () => {
      if (user) {
        try {
          const existingDate = await AsyncStorage.getItem(`${SIGNUP_DATE_KEY}-${user.id}`);
          if (!existingDate) {
            // First time user - store current date as signup date
            const signupDate = new Date().toISOString();
            await AsyncStorage.setItem(`${SIGNUP_DATE_KEY}-${user.id}`, signupDate);
            console.log('📅 Stored signup date for new user:', signupDate);
            
            // Clear any previous notification history for clean start
            await AsyncStorage.removeItem(`${STORAGE_KEY}-${user.id}`);
            console.log('🧹 Cleared previous notification history for new user');
          }
        } catch (error) {
          console.error('Error storing signup date:', error);
        }
      }
    };

    storeSignupDate();
  }, [user]);

  useEffect(() => {
    if (loading || error || !user) return;

    const checkForNewAchievements = async () => {
      try {
        // Get user's signup date
        const signupDateStr = await AsyncStorage.getItem(`${SIGNUP_DATE_KEY}-${user.id}`);
        if (!signupDateStr) {
          console.log('⏭️ No signup date found, skipping notifications (likely existing user)');
          return;
        }

        const signupDate = new Date(signupDateStr);
        const now = new Date();
        
        // Only process notifications if user signed up recently (within last 24 hours of first launch)
        // This prevents spam for existing users while allowing new users to get notifications
        const hoursSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60);
        
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

        console.log('🏆 Achievement notification check:', {
          signupDate: signupDateStr,
          hoursSinceSignup: Math.round(hoursSinceSignup),
          currentlyAchieved: currentlyAchieved.length,
          previouslyNotified: previouslyNotified.length,
          newAchievements: newAchievements.length
        });

        // Only send notifications for achievements earned after signup
        // and only if user signed up recently (prevents spam for existing users)
        if (newAchievements.length > 0 && hoursSinceSignup < 24) {
          for (const achievementId of newAchievements) {
            const achievement = achievements.find(a => a.id === achievementId);
            if (achievement) {
              console.log('🎉 Sending notification for new achievement:', achievement.title);
              await sendAchievementNotification(
                achievement.title,
                achievement.description,
                achievement.emoji
              );
            }
          }

          // Update storage with all currently achieved achievements
          await AsyncStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(currentlyAchieved));
        } else if (hoursSinceSignup >= 24 && newAchievements.length > 0) {
          // For users who signed up more than 24 hours ago, just update the storage without notifications
          await AsyncStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(currentlyAchieved));
          console.log('🔕 User signed up >24h ago, updating storage without notifications');
        }

        // Always trigger background achievement check for any user (regardless of signup time)
        // This ensures background processing works for all users
        if (newAchievements.length > 0) {
          console.log('🔕 Triggering background achievement check for new achievements');
          await sendAchievementCheckNotification();
        }

      } catch (error) {
        console.error('Error in achievement notifications:', error);
      }
    };

    checkForNewAchievements();
  }, [achievements, loading, error, sendAchievementNotification, user]);

  // Function to reset notification history (useful for testing)
  const resetNotificationHistory = async () => {
    try {
      if (user) {
        await AsyncStorage.removeItem(`${STORAGE_KEY}-${user.id}`);
        await AsyncStorage.removeItem(`${SIGNUP_DATE_KEY}-${user.id}`);
        console.log('Achievement notification history reset for user:', user.id);
      }
    } catch (error) {
      console.log('Error resetting notification history:', error);
    }
  };

  // Function to manually set signup date (for testing)
  const setSignupDate = async (date: Date) => {
    try {
      if (user) {
        await AsyncStorage.setItem(`${SIGNUP_DATE_KEY}-${user.id}`, date.toISOString());
        console.log('Manually set signup date for user:', user.id, date.toISOString());
      }
    } catch (error) {
      console.log('Error setting signup date:', error);
    }
  };

  return {
    resetNotificationHistory,
    setSignupDate,
  };
} 