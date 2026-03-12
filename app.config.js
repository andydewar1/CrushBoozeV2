export default ({ config }) => {
  const iosKey = "appl_IZlbmfEexoAYKdqRkGjCBrZrOSe";
  const androidKey = "goog_CgXPzjcynVrqUtQBoQAwKhqpOcF"; // TODO: Update for CrushBooze Android

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['expo-notifications', {
        icon: './assets/notification-icon.png',
        color: '#ffffff',
        sounds: [],
        mode: 'production',
        enableBackgroundRemoteNotifications: true,
        backgroundMode: ['remote-notification'],
        ios: {
          backgroundMode: ['remote-notification']
        }
      }]
    ],
    extra: {
      ...config.extra,
      REVENUECAT_API_KEY_IOS: iosKey,
      REVENUECAT_API_KEY_ANDROID: androidKey,
      // Supabase configuration from environment variables
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      eas: { projectId: "308794b0-e823-46fa-9697-3905d814e2b2" }
    },
  };
};