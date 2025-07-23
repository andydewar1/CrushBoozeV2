import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Achievement {
  id: number;
  title: string;
  description: string;
  badge_emoji: string;
  days_required: number;
  money_required: number | null;
  category: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: number;
  unlocked_at: string | null;
}

interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlocked_at: string | null;
  days_to_go: number | null;
}

export function useAchievements() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAchieved, setTotalAchieved] = useState(0);
  const [daysToNextAchievement, setDaysToNextAchievement] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchAchievements() {
      try {
        setLoading(true);
        
        if (!session?.user?.id) {
          throw new Error('User not authenticated');
        }
        
        // First get the user's quit date
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('quit_date')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        if (!userData?.quit_date) throw new Error('No quit date found');

        const quitDate = new Date(userData.quit_date);
        const daysSinceQuit = Math.floor((Date.now() - quitDate.getTime()) / (1000 * 60 * 60 * 24));

        // Get all achievements and user's unlocked achievements
        const [{ data: achievementsData, error: achievementsError }, { data: userAchievements, error: userAchievementsError }] = await Promise.all([
          supabase.from('achievements').select('*').order('days_required', { ascending: true }),
          supabase.from('user_achievements').select('*').eq('user_id', session.user.id)
        ]);

        if (achievementsError) throw achievementsError;
        if (userAchievementsError) throw userAchievementsError;

        const userAchievementsMap = new Map(
          (userAchievements || []).map(ua => [ua.achievement_id, ua])
        );

        // Combine and calculate progress
        const achievementsWithProgress = (achievementsData || []).map(achievement => {
          const userAchievement = userAchievementsMap.get(achievement.id);
          const daysToGo = Math.max(0, achievement.days_required - daysSinceQuit);
          
          return {
            ...achievement,
            unlocked: !!userAchievement?.unlocked_at,
            unlocked_at: userAchievement?.unlocked_at || null,
            days_to_go: daysToGo
          };
        });

        // Calculate totals
        const achieved = achievementsWithProgress.filter(a => a.unlocked).length;
        const nextUnlocked = achievementsWithProgress.find(a => !a.unlocked);

        setAchievements(achievementsWithProgress);
        setTotalAchieved(achieved);
        setDaysToNextAchievement(nextUnlocked?.days_to_go || 0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [session?.user?.id]);

  return {
    achievements,
    loading,
    error,
    totalAchieved,
    daysToNextAchievement
  };
} 