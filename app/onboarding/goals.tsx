import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Heart, Activity, Moon, Scale, Wallet, Stethoscope } from 'lucide-react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import GoalCard from '@/components/GoalCard';
import { useOnboarding } from '@/contexts/OnboardingContext';

const GOALS = [
  {
    id: 'money',
    title: 'Save Money',
    icon: <Wallet size={32} color="#FFFFFF" strokeWidth={1.5} />,
  },
  {
    id: 'health',
    title: 'Improve Health',
    icon: <Stethoscope size={32} color="#FFFFFF" strokeWidth={1.5} />,
  },
  {
    id: 'sleep',
    title: 'Sleep Better',
    icon: <Moon size={32} color="#FFFFFF" strokeWidth={1.5} />,
  },
  {
    id: 'balance',
    title: 'More Balance',
    icon: <Scale size={32} color="#FFFFFF" strokeWidth={1.5} />,
  },
  {
    id: 'compassion',
    title: 'Self-Compassion',
    icon: <Heart size={32} color="#FFFFFF" strokeWidth={1.5} />,
  },
  {
    id: 'stress',
    title: 'Reduce Stress',
    icon: <Activity size={32} color="#FFFFFF" strokeWidth={1.5} />,
  },
];

export default function GoalsScreen() {
  const { data, updateData } = useOnboarding();
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set(data.personalGoals));

  // Keep selectedGoals in sync with context
  useEffect(() => {
    setSelectedGoals(new Set(data.personalGoals));
  }, [data.personalGoals]);

  const toggleGoal = (goalId: string) => {
    const newSelected = new Set(selectedGoals);
    if (newSelected.has(goalId)) {
      newSelected.delete(goalId);
    } else {
      newSelected.add(goalId);
    }
    setSelectedGoals(newSelected);

    // Update onboarding context with array of selected goals
    const selectedGoalsArray = Array.from(newSelected);
    updateData({
      personalGoals: selectedGoalsArray
    });

    // Log for debugging
    console.log('Selected goals:', selectedGoalsArray);
  };

  return (
    <OnboardingScreen
      title="Why do you want to give up vaping?"
      subtitle="What's important to you?"
      currentStep={2}
      totalSteps={7}
      nextScreen="/onboarding/vape-types"
      previousScreen="/onboarding/quit-date"
      canProgress={selectedGoals.size > 0}
    >
      <View style={styles.container}>
        <View style={styles.grid}>
          {GOALS.map((goal) => (
            <GoalCard
              key={goal.id}
              title={goal.title}
              icon={goal.icon}
              selected={selectedGoals.has(goal.id)}
              onPress={() => toggleGoal(goal.id)}
            />
          ))}
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
}); 