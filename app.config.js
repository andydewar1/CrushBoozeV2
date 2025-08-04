export default ({ config }) => {
  // Get the single API key or platform-specific keys
  const singleApiKey = process.env.REVENUECAT_API_KEY;
  const iosKey = process.env.REVENUECAT_API_KEY_IOS || singleApiKey;
  const androidKey = process.env.REVENUECAT_API_KEY_ANDROID || singleApiKey;

  return {
    ...config,
    extra: {
      ...config.extra,
      REVENUECAT_API_KEY: singleApiKey,
      REVENUECAT_API_KEY_IOS: iosKey,
      REVENUECAT_API_KEY_ANDROID: androidKey,
      // Supabase configuration from environment variables
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
  };
}; 