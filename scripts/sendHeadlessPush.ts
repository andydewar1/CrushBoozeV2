import axios from 'axios';

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/sendHeadlessPush.ts ExponentPushToken[XXXX]');
  process.exit(1);
}
if (!token.startsWith('ExponentPushToken[')) {
  console.error('Invalid token format.');
  process.exit(1);
}

(async () => {
  try {
    const EXPO_SEND = 'https://exp.host/--/api/v2/push/send';
    const msg = {
      to: token,
      _contentAvailable: true, // iOS background
      priority: 'high',
      data: { 
        type: 'ACHIEVEMENT_CHECK', 
        ts: Math.floor(Date.now() / 1000),
        force: true // For testing
      }
    };
    const { data } = await axios.post(EXPO_SEND, msg, { headers: { 'Content-Type': 'application/json' } });
    console.log('Send response:', data);
    process.exit(0);
  } catch (e: any) {
    console.error('Send error:', e?.response?.data || e?.message || e);
    process.exit(1);
  }
})();
