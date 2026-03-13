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
      lightColor: '#03045e',
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

// ============================================================================
// SINGLE SOURCE OF TRUTH: Schedule daily 12pm local notification
// ============================================================================
export async function scheduleProgressNotifications() {
  console.log('[NotificationContext] 🔔 scheduleProgressNotifications called');
  
  // Check permissions directly instead of relying on state
  const { status } = await Notifications.getPermissionsAsync();
  console.log('[NotificationContext] 📋 Current permission status:', status);
  
  if (status !== 'granted') {
    console.log('[NotificationContext] ❌ No notification permissions - cannot schedule');
    return;
  }

  try {
    // Check if notifications are already scheduled
    const existingScheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[NotificationContext] 🔍 Existing scheduled notifications:', existingScheduled.length);
    
    if (existingScheduled.length > 0) {
      console.log('[NotificationContext] ✅ Notification already scheduled - skipping reschedule');
      existingScheduled.forEach((notif, idx) => {
        console.log(`[NotificationContext]   📋 [${idx}] ID: ${notif.identifier}`);
        console.log(`[NotificationContext]   ⏰ Trigger:`, JSON.stringify(notif.trigger));
      });
      return;
    }

    console.log('[NotificationContext] 📅 No notifications scheduled - creating new daily 12pm notification');

    // Schedule daily notification at 12:00 PM local time
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's progress is in 🎉",
        body: "Tap here to see your wins 👀",
        data: { type: 'daily_progress' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 12,
        minute: 0,
      },
    });

    console.log('[NotificationContext] ✅ Daily 12pm notification scheduled successfully!');
    console.log('[NotificationContext] 🆔 Notification ID:', notificationId);
    console.log('[NotificationContext] ⏰ Trigger: DAILY at 12:00 local time');
    
    // Verify the notification was scheduled correctly
    const verifyScheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[NotificationContext] ✅ Verification: Total scheduled notifications:', verifyScheduled.length);
    verifyScheduled.forEach((notif) => {
      console.log('[NotificationContext]   📋 Verified notification:', {
        id: notif.identifier,
        trigger: notif.trigger,
      });
    });
    
  } catch (error) {
    console.error('[NotificationContext] ❌ Error scheduling notification:', error);
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);


  // Check existing permissions on mount and schedule notifications if we have them
  useEffect(() => {
    const checkExistingPermissions = async () => {
      try {
        console.log('[NotificationContext] 🚀 Checking permissions on app launch...');
        const { status } = await Notifications.getPermissionsAsync();
        const hasPerms = status === 'granted';
        console.log('[NotificationContext] 📋 Permission status on launch:', status);
        setHasPermissions(hasPerms);
        
        // If we have permissions, auto-schedule notifications (subsequent launches)
        if (hasPerms) {
          console.log('[NotificationContext] ✅ Permissions granted - scheduling notifications...');
          await scheduleProgressNotifications();
        } else {
          console.log('[NotificationContext] ⚠️ No permissions yet - waiting for user to grant on Home screen');
        }

        // Review prompt system
        try {
          const { recordFirstOpenIfMissing, maybeRequestReviewIfEligible } = await import('@/lib/reviews');
          await recordFirstOpenIfMissing();
          await maybeRequestReviewIfEligible();
        } catch (error) {
          console.log('[NotificationContext] Review system not available:', error);
        }
      } catch (error) {
        console.log('[NotificationContext] ❌ Error checking permissions:', error);
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