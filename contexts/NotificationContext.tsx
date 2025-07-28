import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
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
    throw new Error('useNotifications must be used within a NotificationProvider');
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
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
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

  // Check existing permissions on mount
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} Achievement Unlocked!`,
          body: `You've earned a new badge: ${title}. Congratulations!`,
          data: { 
            type: 'achievement',
            achievementTitle: title,
            achievementDescription: description,
            emoji
          },
        },
        trigger: null, // Show immediately
      });
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

  const value: NotificationContextType = {
    expoPushToken,
    notificationSettings,
    updateNotificationSettings,
    requestPermissions,
    sendAchievementNotification,
    sendMoneySavedNotification,
    sendDailyReminderNotification,
    hasPermissions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 