import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      REVENUECAT_API_KEY_IOS: process.env.REVENUECAT_API_KEY_IOS,
      REVENUECAT_API_KEY_ANDROID: process.env.REVENUECAT_API_KEY_ANDROID,
    },
  };
}; 