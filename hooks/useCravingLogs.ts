import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface CravingLog {
  id: string;
  timestamp: Date;
  intensity: number;
  trigger: string;
  coping_strategy: string;
  notes: string | null;
}

export interface CravingStats {
  totalLogs: number;
  averageIntensity: number;
  lowIntensityCount: number; // intensity <= 3
}

export function useCravingLogs() {
  const { session } = useAuth();
  const [logs, setLogs] = useState<CravingLog[]>([]);
  const [stats, setStats] = useState<CravingStats>({
    totalLogs: 0,
    averageIntensity: 0,
    lowIntensityCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    async function fetchCravingLogs() {
      try {
        setLoading(true);

        // Get all craving logs for the user
        const { data: cravingLogs, error: logsError } = await supabase
          .from('craving_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('timestamp', { ascending: false });

        if (logsError) throw logsError;

        // Transform the data
        const transformedLogs = (cravingLogs || []).map(log => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));

        // Calculate statistics
        const totalLogs = transformedLogs.length;
        const intensitySum = transformedLogs.reduce((sum, log) => sum + log.intensity, 0);
        const averageIntensity = totalLogs > 0 ? intensitySum / totalLogs : 0;
        const lowIntensityCount = transformedLogs.filter(log => log.intensity <= 3).length;

        setLogs(transformedLogs);
        setStats({
          totalLogs,
          averageIntensity,
          lowIntensityCount
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching craving logs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load craving logs');
      } finally {
        setLoading(false);
      }
    }

    fetchCravingLogs();
  }, [session?.user?.id]);

  const addCravingLog = async (log: Omit<CravingLog, 'id'>) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('craving_logs')
        .insert([{
          user_id: session.user.id,
          timestamp: log.timestamp.toISOString(),
          intensity: log.intensity,
          trigger: log.trigger,
          coping_strategy: log.coping_strategy,
          notes: log.notes
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      const newLog = {
        ...data,
        timestamp: new Date(data.timestamp)
      };

      setLogs(prevLogs => [newLog, ...prevLogs]);
      
      // Update stats
      setStats(prevStats => {
        const newTotal = prevStats.totalLogs + 1;
        return {
          totalLogs: newTotal,
          averageIntensity: (prevStats.averageIntensity * prevStats.totalLogs + log.intensity) / newTotal,
          lowIntensityCount: log.intensity <= 3 ? prevStats.lowIntensityCount + 1 : prevStats.lowIntensityCount
        };
      });

      return newLog;
    } catch (err) {
      console.error('Error adding craving log:', err);
      setError(err instanceof Error ? err.message : 'Failed to add craving log');
      return null;
    }
  };

  const deleteCravingLog = async (logId: string) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('craving_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;

      // Update local state
      const deletedLog = logs.find(log => log.id === logId);
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      
      // Update stats
      if (deletedLog) {
        setStats(prevStats => {
          const newTotal = prevStats.totalLogs - 1;
          return {
            totalLogs: newTotal,
            averageIntensity: newTotal > 0 
              ? (prevStats.averageIntensity * prevStats.totalLogs - deletedLog.intensity) / newTotal 
              : 0,
            lowIntensityCount: deletedLog.intensity <= 3 
              ? prevStats.lowIntensityCount - 1 
              : prevStats.lowIntensityCount
          };
        });
      }

      return true;
    } catch (err) {
      console.error('Error deleting craving log:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete craving log');
      return false;
    }
  };

  return {
    logs,
    stats,
    loading,
    error,
    addCravingLog,
    deleteCravingLog
  };
} 