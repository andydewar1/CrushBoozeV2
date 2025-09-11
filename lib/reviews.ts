import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Lazy import pattern to avoid "Cannot find native module" errors
let StoreReview: typeof import('expo-store-review') | null = null;

async function getStoreReview() {
  if (Platform.OS !== 'ios') return null;
  if (!StoreReview) {
    try {
      StoreReview = await import('expo-store-review');
    } catch (error) {
    // Silently fail if module not available
      return null;
    }
  }
  return StoreReview;
}

// Storage keys
const FIRST_OPEN_AT_KEY = 'firstOpenAt';
const LAST_REVIEW_REQUEST_AT_KEY = 'lastReviewRequestAt';
const HAS_ASKED_FOR_REVIEW_KEY = 'hasAskedForReview';

// Constants
const DAYS_BEFORE_REVIEW = 7;
const COOLDOWN_DAYS = 90;

/**
 * Helper to calculate days between a date and now
 */
export function daysSince(dateIso: string): number {
  const date = new Date(dateIso);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Records the first app open timestamp if not already set
 * Should be called on every app launch
 */
export async function recordFirstOpenIfMissing(): Promise<void> {
  // iOS only - gracefully no-op on Android
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    const firstOpenAt = await AsyncStorage.getItem(FIRST_OPEN_AT_KEY);
    
    if (!firstOpenAt) {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(FIRST_OPEN_AT_KEY, now);
      
      if (__DEV__) {
        console.log(`Review: firstOpenAt set to ${now}`);
      }
    }
  } catch (error) {
    // Fail silently - don't block app startup
    if (__DEV__) {
      console.log('Review: Error recording first open:', error);
    }
  }
}

/**
 * Checks if the user is eligible for a review prompt
 * Returns false if not enough time has passed or if recently prompted
 */
export async function isEligibleForReview(): Promise<boolean> {
  // iOS only - gracefully return false on Android
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    // Get StoreReview module safely
    const SR = await getStoreReview();
    if (!SR) return false;

    // Check if iOS will actually show the review prompt
    const hasAction = await SR.hasAction();
    if (!hasAction) {
      if (__DEV__) {
        console.log('Review: iOS hasAction=false, not eligible');
      }
      return false;
    }

    // Check if enough days have passed since first open
    const firstOpenAt = await AsyncStorage.getItem(FIRST_OPEN_AT_KEY);
    if (!firstOpenAt) {
      if (__DEV__) {
        console.log('Review: No firstOpenAt found, not eligible');
      }
      return false;
    }

    const daysSinceFirstOpen = daysSince(firstOpenAt);
    if (daysSinceFirstOpen < DAYS_BEFORE_REVIEW) {
      if (__DEV__) {
        console.log(`Review: Only ${daysSinceFirstOpen} days since first open, need ${DAYS_BEFORE_REVIEW}`);
      }
      return false;
    }

    // Check cooldown period since last review request
    const lastReviewRequestAt = await AsyncStorage.getItem(LAST_REVIEW_REQUEST_AT_KEY);
    if (lastReviewRequestAt) {
      const daysSinceLastPrompt = daysSince(lastReviewRequestAt);
      if (daysSinceLastPrompt < COOLDOWN_DAYS) {
        if (__DEV__) {
          console.log(`Review: Only ${daysSinceLastPrompt} days since last prompt, need ${COOLDOWN_DAYS}`);
        }
        return false;
      }
    }

    if (__DEV__) {
      console.log(`Review: Eligible! daysSinceFirstOpen=${daysSinceFirstOpen}, daysSinceLastPrompt=${lastReviewRequestAt ? daysSince(lastReviewRequestAt) : 'never'}`);
    }

    return true;
  } catch (error) {
    // Fail silently - don't block app functionality
    if (__DEV__) {
      console.log('Review: Error checking eligibility:', error);
    }
    return false;
  }
}

/**
 * Requests a review if the user is eligible
 * Automatically handles eligibility check and cooldown tracking
 */
export async function maybeRequestReviewIfEligible(): Promise<void> {
  // iOS only - gracefully no-op on Android
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    const eligible = await isEligibleForReview();
    
    if (eligible) {
      // Get StoreReview module safely
      const SR = await getStoreReview();
      if (!SR) return;

      if (__DEV__) {
        console.log('Review: Requesting review from Apple...');
      }
      
      // Request the review using Apple's native sheet
      await SR.requestReview();
      
      // Record that we made the request (for cooldown tracking)
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_REVIEW_REQUEST_AT_KEY, now);
      await AsyncStorage.setItem(HAS_ASKED_FOR_REVIEW_KEY, 'true');
      
      if (__DEV__) {
        console.log(`Review: requestReview() called, cooldown set until ${new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString()}`);
      }
    }
  } catch (error) {
    // Fail silently - don't block app functionality
    if (__DEV__) {
      console.log('Review: Error requesting review:', error);
    }
  }
}

