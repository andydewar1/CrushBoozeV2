export default ({ config }) => {
  const iosKey = "appl_acqtvMQYwixBkxfQviZTLqKKJKc";
  const androidKey = "goog_CgXPzjcynVrqUtQBoQAwKhqpOcF";

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
      eas: { projectId: "4fb906e8-fea5-4082-8a0e-445722ad3558" }
    },
  };
};