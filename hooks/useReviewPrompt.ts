import { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

const REVIEW_PROMPT_KEY = '@review_prompt_shown';
const SIGNUP_DATE_KEY = 'user-signup-date';
const DAYS_BEFORE_PROMPT = 3; // Show after 3 days

export const useReviewPrompt = () => {
  const { user } = useAuth();

  useEffect(() => {
    const checkForReviewPrompt = async () => {
      try {
        if (!user) return;

        // Check if we've already shown the prompt
        const hasShownPrompt = await AsyncStorage.getItem(`${REVIEW_PROMPT_KEY}-${user.id}`);
        if (hasShownPrompt) return;

        // Get user's signup date
        const signupDateStr = await AsyncStorage.getItem(`${SIGNUP_DATE_KEY}-${user.id}`);
        if (!signupDateStr) {
          console.log('⏭️ No signup date found, skipping review prompt');
          return;
        }

        const signupDate = new Date(signupDateStr);
        const now = new Date();
        const daysSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24);

        console.log('📅 Review prompt check:', {
          signupDate: signupDateStr,
          daysSinceSignup: Math.round(daysSinceSignup * 10) / 10,
          threshold: DAYS_BEFORE_PROMPT
        });

        // Only show after user has been using the app for 3+ days
        if (daysSinceSignup < DAYS_BEFORE_PROMPT) return;

        // Show the review prompt
        showReviewPrompt();
        
        // Mark as shown
        await AsyncStorage.setItem(`${REVIEW_PROMPT_KEY}-${user.id}`, 'true');
        console.log('⭐ Review prompt shown to user');
      } catch (error) {
        console.error('Error checking review prompt:', error);
      }
    };

    checkForReviewPrompt();
  }, [user]);

  const showReviewPrompt = () => {
    Alert.alert(
      '🌟 Loving CrushNic?',
      'Your progress is amazing! Would you mind leaving us a review? It helps others discover our app and keeps us motivated to make it even better.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Rate App ⭐',
          onPress: () => openAppStore(),
        },
      ]
    );
  };

  const openAppStore = () => {
    const appId = 'your-app-id'; // Replace with actual App Store ID
    const url = Platform.select({
      ios: `https://apps.apple.com/app/id${appId}?action=write-review`,
      android: `market://details?id=com.crushnic.quitvaping&showAllReviews=true`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to web version
        const webUrl = Platform.select({
          ios: `https://apps.apple.com/app/id${appId}`,
          android: `https://play.google.com/store/apps/details?id=com.crushnic.quitvaping`,
        });
        if (webUrl) {
          Linking.openURL(webUrl);
        }
      });
    }
  };

  return { showReviewPrompt };
};
