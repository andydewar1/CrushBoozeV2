import * as Notifications from 'expo-notifications';

export async function ensurePushToken(): Promise<string | null> {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted') {
    console.log('[BG] 🔒 Permissions not granted — skip fetching token');
    return null;
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('[BG] 🔑 Expo push token', token);
  return token;
}