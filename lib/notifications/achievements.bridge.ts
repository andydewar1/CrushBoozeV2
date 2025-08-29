import { bgLog } from './bgLog';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

type BgPayload = {
  type?: string;
  userId?: string;
  ts?: number;
  reason?: string;
  [k: string]: any;
};

async function checkAndUnlockAchievements(userId: string) {
  try {
    bgLog(`🔍 Starting achievement check for user ${userId}`);
    
    // Get user's quit date
    bgLog('📅 Fetching user quit date');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('quit_date')
      .eq('id', userId)
      .single();
    
    if (userError) {
      bgLog(`❌ Failed to fetch user data: ${JSON.stringify(userError)}`);
      throw userError;
    }

    if (!userData?.quit_date) {
      bgLog('❌ No quit date found for user');
      return;
    }

    bgLog(`✅ Found user data: ${JSON.stringify(userData)}`);

    const quitDate = new Date(userData.quit_date);
    const now = new Date();
    const daysSinceQuit = Math.floor((now.getTime() - quitDate.getTime()) / (1000 * 60 * 60 * 24));
    
    bgLog(`📊 Achievement check details:
    - Quit date: ${quitDate.toISOString()}
    - Current time: ${now.toISOString()}
    - Days since quit: ${daysSinceQuit}
    - Milliseconds diff: ${now.getTime() - quitDate.getTime()}
    `);

    // Get all achievements that should be unlocked based on days
    bgLog('🏆 Fetching eligible achievements');
    const { data: achievementsToUnlock, error: achievementsError } = await supabase
      .from('achievements')
      .select('id, days_required, title, description, emoji')
      .lte('days_required', daysSinceQuit)
      .order('days_required', { ascending: true });

    if (achievementsError) {
      bgLog(`❌ Failed to fetch achievements: ${JSON.stringify(achievementsError)}`);
      throw achievementsError;
    }

    if (!achievementsToUnlock?.length) {
      bgLog('ℹ️ No achievements eligible for unlocking');
      return;
    }

    bgLog(`✅ Found ${achievementsToUnlock.length} eligible achievements:`);
    achievementsToUnlock.forEach(a => 
      bgLog(`  - "${a.title}" (${a.days_required} days required)`)
    );

    // Get user's already unlocked achievements
    bgLog('🔍 Checking previously unlocked achievements');
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (userAchievementsError) {
      bgLog(`❌ Failed to fetch user achievements: ${JSON.stringify(userAchievementsError)}`);
      throw userAchievementsError;
    }

    // Filter out already unlocked achievements
    bgLog(`📋 Currently unlocked achievements: ${JSON.stringify(userAchievements?.map(ua => ua.achievement_id))}`);
    
    const unlockedIds = new Set((userAchievements || []).map(ua => ua.achievement_id));
    const newAchievements = achievementsToUnlock.filter(a => !unlockedIds.has(a.id));

    if (!newAchievements.length) {
      bgLog('ℹ️ No new achievements to unlock');
      return;
    }

    bgLog(`🎉 Found ${newAchievements.length} new achievements to unlock:`);
    newAchievements.forEach(a => 
      bgLog(`  - "${a.title}" (ID: ${a.id})`)
    );

    // Insert new achievements
    bgLog('💾 Saving new achievements to database');
    const { error: insertError } = await supabase
      .from('user_achievements')
      .insert(
        newAchievements.map(achievement => ({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        }))
      );

    if (insertError) {
      bgLog(`❌ Failed to save achievements: ${JSON.stringify(insertError)}`);
      throw insertError;
    }

    bgLog('✅ Successfully saved achievements');

    // Force send notifications for each new achievement
    bgLog(`🔔 Sending notifications for ${newAchievements.length} achievements`);
    
    for (const achievement of newAchievements) {
      const achievementData = achievementsToUnlock.find(a => a.id === achievement.id);
      if (achievementData?.title) {
        bgLog(`📱 Processing notification for: ${achievementData.title}`);
        
        const notificationContent = {
          title: `🎉 Achievement Unlocked!`,
          body: `Congratulations! You've unlocked a new achievement. Tap to see your progress!`,
          data: { 
            type: 'achievement',
            achievementId: achievement.id,
            achievementTitle: achievementData.title,
            forceShow: true
          }
        };

        try {
          bgLog('📲 Background achievement processing completed for: ' + achievementData.title);
          // Note: Achievement notifications are now handled by the frontend push notification system
          
        } catch (error) {
          bgLog(`❌ Failed to process achievement "${achievementData.title}": ${error}`);
          bgLog(`Stack trace: ${error?.stack || 'No stack trace'}`);
        }
      }
    }
    
    bgLog('✅ All notifications processed');
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

export async function runAchievementCheckFromPush(payload: BgPayload): Promise<void> {
  bgLog('🎯🎯🎯 ACHIEVEMENT CHECK STARTING 🎯🎯🎯');
  bgLog(`📦 RECEIVED PAYLOAD: ${JSON.stringify(payload, null, 2)}`);
  bgLog(`🔍 Payload type: ${payload?.type}`);
  bgLog(`🔍 Payload keys: ${Object.keys(payload || {}).join(', ')}`);

  if (payload?.type !== 'ACHIEVEMENT_CHECK') {
    bgLog(`❌ INVALID PAYLOAD TYPE - EXPECTED: 'ACHIEVEMENT_CHECK', GOT: '${payload?.type}'`);
    bgLog(`❌ ABORTING ACHIEVEMENT CHECK`);
    return;
  }

  bgLog('✅ VALID PAYLOAD TYPE - PROCEEDING WITH ACHIEVEMENT CHECK');

  const start = Date.now();
  try {
    bgLog('🔐 Getting Supabase session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      bgLog(`❌ Session error: ${JSON.stringify(sessionError)}`);
      return;
    }

    if (!session?.user?.id) {
      bgLog('❌ No active session or user ID');
      return;
    }

    bgLog(`👤 User authenticated: ${session.user.id}`);
    bgLog('🔄 Starting achievement check');

    await checkAndUnlockAchievements(session.user.id);
    
    const duration = Date.now() - start;
    bgLog(`✅ Achievement check completed in ${duration}ms`);

    // Log memory usage
    const memory = process.memoryUsage();
    bgLog(`📊 Memory usage: ${JSON.stringify({
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memory.external / 1024 / 1024) + 'MB',
    })}`);

  } catch (e: any) {
    bgLog(`❌ Achievement check failed: ${e?.message || String(e)}`);
    bgLog(`Stack trace: ${e?.stack || 'No stack trace'}`);
  }
}
