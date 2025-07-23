import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useAchievementCheck() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.user?.id) return;

    async function checkAndUnlockAchievements() {
      try {
        if (!session?.user?.id) {
          throw new Error('User not authenticated');
        }

        // Get user's quit date
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('quit_date')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        if (!userData?.quit_date) return;

        const quitDate = new Date(userData.quit_date);
        const daysSinceQuit = Math.floor((Date.now() - quitDate.getTime()) / (1000 * 60 * 60 * 24));

        // Get all achievements that should be unlocked based on days
        const { data: achievementsToUnlock, error: achievementsError } = await supabase
          .from('achievements')
          .select('id, days_required')
          .lte('days_required', daysSinceQuit)
          .order('days_required', { ascending: true });

        if (achievementsError) throw achievementsError;
        if (!achievementsToUnlock?.length) return;

        // Get user's already unlocked achievements
        const { data: userAchievements, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', session.user.id);

        if (userAchievementsError) throw userAchievementsError;

        // Filter out already unlocked achievements
        const unlockedIds = new Set((userAchievements || []).map(ua => ua.achievement_id));
        const newAchievements = achievementsToUnlock.filter(a => !unlockedIds.has(a.id));

        if (!newAchievements.length) return;

        // Insert new achievements
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert(
            newAchievements.map(achievement => ({
              user_id: session.user.id,
              achievement_id: achievement.id,
              unlocked_at: new Date().toISOString()
            }))
          );

        if (insertError) throw insertError;
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    }

    // Check achievements immediately and then every hour
    checkAndUnlockAchievements();
    const interval = setInterval(checkAndUnlockAchievements, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [session?.user?.id]);
} 