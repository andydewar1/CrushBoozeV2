import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior - ALWAYS show achievement notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Check if this is an achievement notification
    const isAchievement = notification.request.content.data?.type === 'achievement';
    
    console.log('🔔 Notification received:', {
      type: notification.request.content.data?.type,
      title: notification.request.content.title,
      isAchievement
    });
    
    if (isAchievement) {
      console.log('🎉 ACHIEVEMENT NOTIFICATION - FORCING DISPLAY');
      // ALWAYS show achievement notifications regardless of app state
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }
    
    // Show other notifications normally
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

interface NotificationSettings {
  achievementNotifications: boolean;
  moneySavedNotifications: boolean;
  dailyReminders: boolean;
}

interface NotificationContextType {
  expoPushToken: string | null;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  sendAchievementNotification: (title: string, description: string, emoji: string) => Promise<void>;
  sendMoneySavedNotification: (amount: number, currency: string) => Promise<void>;
  sendDailyReminderNotification: () => Promise<void>;
  sendAchievementCheckNotification: () => Promise<void>;
  hasPermissions: boolean;
}

const defaultSettings: NotificationSettings = {
  achievementNotifications: true,
  moneySavedNotifications: true,
  dailyReminders: false,
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    console.error('❌ useNotifications must be used within a NotificationProvider');
    // Return a safe default instead of throwing
    return {
      expoPushToken: null,
      notificationSettings: defaultSettings,
      updateNotificationSettings: async () => {},
      requestPermissions: async () => false,
      sendAchievementNotification: async () => {},
      sendMoneySavedNotification: async () => {},
      sendDailyReminderNotification: async () => {},
      sendAchievementCheckNotification: async () => {},
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
    
    if (existingStatus !== 'granted') {
      console.log('Permissions not granted, cannot get push token');
      return null;
    }
    
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
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    // Load saved notification settings
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('notification-settings');
        if (saved) {
          setNotificationSettings({ ...defaultSettings, ...JSON.parse(saved) });
        }
      } catch (error) {
        console.log('Error loading notification settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Check existing permissions on mount (but don't request them)
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
      } catch (error) {
        console.log('Error checking existing permissions:', error);
      }
    };

    checkExistingPermissions();
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    const token = await registerForPushNotificationsAsync();
    setExpoPushToken(token);
    const hasPerms = token !== null;
    setHasPermissions(hasPerms);
    return hasPerms;
  };

  const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    const newSettings = { ...notificationSettings, ...settings };
    setNotificationSettings(newSettings);
    
    try {
      await AsyncStorage.setItem('notification-settings', JSON.stringify(newSettings));
    } catch (error) {
      console.log('Error saving notification settings:', error);
    }
  };

  const sendAchievementNotification = async (title: string, description: string, emoji: string) => {
    if (!hasPermissions || !notificationSettings.achievementNotifications) return;

    try {
      // Always get a fresh push token for achievement notifications
      console.log('🔄 Getting fresh push token for achievement notification...');
      
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Permissions not granted for achievement notification');
        return;
      }

      // Get fresh token
      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId: '4fb906e8-fea5-4082-8a0e-445722ad3558'
      });
      
      if (!tokenResult?.data) {
        console.log('❌ Failed to get fresh push token for achievement notification');
        return;
      }

      console.log('🔑 Fresh token obtained for achievement notification:', tokenResult.data);

      // Send VISIBLE push notification that shows even when app is closed/phone locked
      const message = {
        to: tokenResult.data,
        title: `🎉 Achievement Unlocked!`,
        body: `Congratulations! You've unlocked a new achievement. Tap to see your progress!`,
        data: { 
          type: 'achievement',
          achievementTitle: title,
          achievementDescription: description,
          emoji,
          action: 'view_achievements'
        },
        priority: 'high' as const,
        sound: 'default' as const,
        // These ensure the notification shows on lock screen and notification center
        badge: 1,
        channelId: 'default', // Android
      };

      console.log('🚀 SENDING VISIBLE ACHIEVEMENT PUSH NOTIFICATION:', { 
        title, 
        emoji,
        to: tokenResult.data.substring(0, 20) + '...',
        messageBody: message.body
      });
      
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result?.data?.status === 'ok') {
        console.log('✅ VISIBLE ACHIEVEMENT NOTIFICATION SENT SUCCESSFULLY! ID:', result.data.id);
        console.log('📱 This notification WILL appear on lock screen and notification center');
      } else {
        console.error('❌ ACHIEVEMENT NOTIFICATION FAILED:', result);
      }
      
      console.log('📊 Full response:', result);
      
      return result;
    } catch (error) {
      console.log('Error sending achievement notification:', error);
    }
  };

  const sendMoneySavedNotification = async (amount: number, currency: string) => {
    if (!hasPermissions || !notificationSettings.moneySavedNotifications) return;

    const formattedAmount = Math.floor(amount).toLocaleString();
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Money Saved Milestone!',
          body: `Congratulations! You've saved ${currency}${formattedAmount} by quitting vaping!`,
          data: { 
            type: 'money_saved',
            amount,
            currency,
            milestone: amount
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.log('Error sending money saved notification:', error);
    }
  };

  const sendDailyReminderNotification = async () => {
    if (!hasPermissions || !notificationSettings.dailyReminders) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌟 Stay Strong!',
          body: "Remember why you started. Check your progress in CrushNic!",
          data: { type: 'daily_reminder' },
        },
        trigger: null, // Show immediately for now - TODO: implement proper scheduling
      });
    } catch (error) {
      console.log('Error scheduling daily reminder:', error);
    }
  };

  const sendAchievementCheckNotification = async () => {
    try {
      // Always get a fresh push token for achievement checks
      console.log('🔄 Getting fresh push token for achievement check...');
      
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Permissions not granted for achievement check');
        return;
      }

      // Get fresh token
      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId: '4fb906e8-fea5-4082-8a0e-445722ad3558'
      });
      
      if (!tokenResult?.data) {
        console.log('❌ Failed to get fresh push token for achievement check');
        return;
      }

      console.log('🔑 Fresh token obtained for achievement check:', tokenResult.data);

      // Send silent push notification to trigger background achievement check
      const message = {
        to: tokenResult.data,
        contentAvailable: true,
        data: { 
          type: 'ACHIEVEMENT_CHECK',
          timestamp: Date.now(),
          debug: 'background-achievement-check'
        }
        // NO priority for iOS - this was causing issues
      };

      console.log('🔕 SENDING SILENT ACHIEVEMENT CHECK:', JSON.stringify(message, null, 2));
      
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('✅ SILENT NOTIFICATION RESPONSE:', JSON.stringify(result, null, 2));
      
      if (result?.data?.status === 'ok') {
        console.log('🎉 Achievement check notification sent successfully! ID:', result.data.id);
      } else if (result?.data?.status === 'error') {
        console.error('❌ PUSH NOTIFICATION ERROR:', result.data);
      }
    } catch (error: any) {
      console.error('❌ FAILED TO SEND ACHIEVEMENT CHECK:', error?.message || String(error));
    }
  };

  const value: NotificationContextType = {
    expoPushToken,
    notificationSettings,
    updateNotificationSettings,
    requestPermissions,
    sendAchievementNotification,
    sendMoneySavedNotification,
    sendDailyReminderNotification,
    sendAchievementCheckNotification,
    hasPermissions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 