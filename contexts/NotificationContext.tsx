import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Remove direct import to avoid circular dependencies - we'll import dynamically

// Configure notification behavior exactly as per Expo docs
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  hasPermissions: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    console.error('❌ useNotifications must be used within a NotificationProvider');
    // Return a safe default instead of throwing
    return {
      expoPushToken: null,
      hasPermissions: false,
    };
  }
  return context;
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CrushNic Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#35998d',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If permission is not granted, request it
    if (existingStatus !== 'granted') {
      console.log('🔔 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Notification permissions not granted');
      return null;
    }
    
    console.log('✅ Notification permissions granted');
    
    try {
      const projectId = '4fb906e8-fea5-4082-8a0e-445722ad3558'; // From your app.json
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo push token:', token);
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);

  // ============================================================================
  // SIMPLE PROGRESS NOTIFICATIONS - One repeating notification at 12pm daily
  // ============================================================================
  
  const scheduleProgressNotifications = async () => {
    // Check permissions directly instead of relying on state
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ No notification permissions - cannot schedule progress notifications');
      return;
    }

    try {
      // Cancel any existing scheduled notifications to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🧹 Cleared existing scheduled notifications');

      // Schedule daily notification at 12:00 PM
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Today's progress is in 🎉",
          body: "Tap here to see your wins 👀",
          data: { type: 'daily_progress' },
          sound: true,
        },
        trigger: {
          hour: 12,
          minute: 0,
          repeats: true,
        },
      });

      console.log('✅ Daily 12pm notification scheduled successfully');
      
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Scheduled notifications:', scheduled.length, 'notification(s)');
      
    } catch (error) {
      console.error('❌ Error scheduling progress notifications:', error);
    }
  };


  // Check existing permissions on mount and schedule notifications if we have them
  useEffect(() => {
    const checkExistingPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        const hasPerms = status === 'granted';
        setHasPermissions(hasPerms);
        
        // If we have permissions, try to get the push token
        if (hasPerms && Device.isDevice) {
          try {
            const projectId = '4fb906e8-fea5-4082-8a0e-445722ad3558';
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            setExpoPushToken(token);
          } catch (error) {
            console.log('Error getting existing push token:', error);
          }
        }

        // ============================================================================
        // AUTO-SCHEDULE PROGRESS NOTIFICATIONS if we have permissions
        // ============================================================================
        if (hasPerms) {
          console.log('🔔 Auto-scheduling progress notifications on app launch...');
          await scheduleProgressNotifications();
        }

        // ============================================================================
        // REVIEW PROMPT SYSTEM - Record first open and maybe request review
        // ============================================================================
        try {
          const { recordFirstOpenIfMissing, maybeRequestReviewIfEligible } = await import('@/lib/reviews');
          await recordFirstOpenIfMissing();
          await maybeRequestReviewIfEligible();
        } catch (error) {
          console.log('Review system not available yet:', error);
        }
      } catch (error) {
        console.log('Error checking existing permissions:', error);
      }
    };

    checkExistingPermissions();
  }, []);


  const value: NotificationContextType = {
    expoPushToken,
    hasPermissions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 