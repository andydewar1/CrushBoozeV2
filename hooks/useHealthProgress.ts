import { useEffect, useState } from 'react';
import { useUserData } from './useUserData';

type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export interface WHORecoveryStage {
  id: string;
  timeframe: {
    value: number;
    unit: TimeUnit;
  };
  title: string;
  description: string;
  category: 'circulation' | 'respiratory' | 'nervous' | 'general';
  percentageContribution: {
    lungFunction?: number;
    circulation?: number;
    overall?: number;
  };
}

export const WHO_RECOVERY_STAGES: WHORecoveryStage[] = [
  {
    id: '20min',
    timeframe: { value: 20, unit: 'minutes' },
    title: 'Heart rate normalizes',
    description: 'Heart rate and blood pressure drop to normal levels',
    category: 'circulation',
    percentageContribution: {
      circulation: 10
    }
  },
  {
    id: '8hrs',
    timeframe: { value: 8, unit: 'hours' },
    title: 'Oxygen levels normalize',
    description: 'Carbon monoxide levels drop, oxygen levels increase',
    category: 'respiratory',
    percentageContribution: {
      lungFunction: 15
    }
  },
  {
    id: '24hrs',
    timeframe: { value: 24, unit: 'hours' },
    title: 'Heart attack risk begins dropping',
    description: 'Risk of heart attack begins to decrease',
    category: 'circulation',
    percentageContribution: {
      circulation: 15
    }
  },
  {
    id: '48hrs',
    timeframe: { value: 48, unit: 'hours' },
    title: 'Nerve endings recover',
    description: 'Damaged nerve endings start to regrow',
    category: 'nervous',
    percentageContribution: {
      overall: 10
    }
  },
  {
    id: '72hrs',
    timeframe: { value: 72, unit: 'hours' },
    title: 'Breathing becomes easier',
    description: 'Bronchial tubes relax, breathing becomes easier',
    category: 'respiratory',
    percentageContribution: {
      lungFunction: 20
    }
  },
  {
    id: '2weeks',
    timeframe: { value: 2, unit: 'weeks' },
    title: 'Circulation improves',
    description: 'Blood circulation improves significantly',
    category: 'circulation',
    percentageContribution: {
      circulation: 25
    }
  },
  {
    id: '1month',
    timeframe: { value: 1, unit: 'months' },
    title: 'Lung function increases',
    description: 'Lung function and capacity improves',
    category: 'respiratory',
    percentageContribution: {
      lungFunction: 30
    }
  },
  {
    id: '3months',
    timeframe: { value: 3, unit: 'months' },
    title: 'Circulation fully restored',
    description: 'Circulation and lung function significantly improved',
    category: 'circulation',
    percentageContribution: {
      circulation: 50,
      lungFunction: 35
    }
  },
  {
    id: '9months',
    timeframe: { value: 9, unit: 'months' },
    title: 'Lung cilia regrow',
    description: 'Lungs significantly heal and regain normal function',
    category: 'respiratory',
    percentageContribution: {
      lungFunction: 100
    }
  }
];

interface HealthProgress {
  lungFunction: number;
  circulation: number;
  completedStages: string[];
  nextStage: WHORecoveryStage | null;
  currentStageProgress: number;
}

function convertToMilliseconds(timeframe: { value: number; unit: TimeUnit }): number {
  const conversions = {
    minutes: 1000 * 60,
    hours: 1000 * 60 * 60,
    days: 1000 * 60 * 60 * 24,
    weeks: 1000 * 60 * 60 * 24 * 7,
    months: 1000 * 60 * 60 * 24 * 30, // Approximate
    years: 1000 * 60 * 60 * 24 * 365 // Approximate
  };
  
  return timeframe.value * conversions[timeframe.unit];
}

function calculateHealthProgress(quitDate: Date): HealthProgress {
  const now = new Date();
  const timeSinceQuit = now.getTime() - quitDate.getTime();
  
  let lungFunction = 0;
  let circulation = 0;
  const completedStages: string[] = [];
  
  // Sort stages by timeframe
  const sortedStages = WHO_RECOVERY_STAGES.sort((a, b) => 
    convertToMilliseconds(a.timeframe) - convertToMilliseconds(b.timeframe)
  );
  
  // Find completed stages and calculate progress
  for (const stage of sortedStages) {
    const stageTime = convertToMilliseconds(stage.timeframe);
    
    if (timeSinceQuit >= stageTime) {
      completedStages.push(stage.id);
      
      // Add percentage contributions
      if (stage.percentageContribution.lungFunction) {
        lungFunction += stage.percentageContribution.lungFunction;
      }
      if (stage.percentageContribution.circulation) {
        circulation += stage.percentageContribution.circulation;
      }
    } else {
      // This is the next stage
      const progressToNextStage = (timeSinceQuit / stageTime) * 100;
      return {
        lungFunction: Math.min(lungFunction, 100),
        circulation: Math.min(circulation, 100),
        completedStages,
        nextStage: stage,
        currentStageProgress: progressToNextStage
      };
    }
  }
  
  // If all stages completed
  return {
    lungFunction: 100,
    circulation: 100,
    completedStages,
    nextStage: null,
    currentStageProgress: 100
  };
}

export function useHealthProgress() {
  const { userData } = useUserData();
  const [healthProgress, setHealthProgress] = useState<HealthProgress | null>(null);
  
  useEffect(() => {
    if (userData?.quitDate) {
      const progress = calculateHealthProgress(new Date(userData.quitDate));
      setHealthProgress(progress);
    }
  }, [userData?.quitDate]);

  // Update progress every minute
  useEffect(() => {
    if (!userData?.quitDate) return;

    const interval = setInterval(() => {
      const progress = calculateHealthProgress(new Date(userData.quitDate));
      setHealthProgress(progress);
    }, 60000);

    return () => clearInterval(interval);
  }, [userData?.quitDate]);
  
  return healthProgress;
} 