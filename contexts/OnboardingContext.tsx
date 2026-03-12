import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingData {
  // Personal
  name: string;
  
  // Drinking habits (for flow only, not stored long-term)
  drinkingFrequency: string;
  drinksPerSession: string;
  
  // Financial
  weeklySpend: number;
  currency: string;
  
  // Goals & Motivation
  quitReasons: string[];
  financialGoal: {
    description: string;
    amount: number;
  };
  
  // Commitment
  quitDate: Date;
  
  // Random stats (generated once per session)
  comparisonPercentage: number;  // 20-40%
  notAlonePercentage: number;    // 40-60%
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  resetData: () => void;
  
  // Computed values
  yearlySpend: number;
  fiveYearSpend: number;
  ninetyDaySavings: number;
}

// Generate random percentages once
const generateComparisonPercentage = () => Math.floor(Math.random() * 21) + 20; // 20-40%
const generateNotAlonePercentage = () => Math.floor(Math.random() * 21) + 40;   // 40-60%

const defaultData: OnboardingData = {
  name: '',
  drinkingFrequency: '',
  drinksPerSession: '',
  weeklySpend: 0,
  currency: 'GBP',
  quitReasons: [],
  financialGoal: {
    description: '',
    amount: 0,
  },
  quitDate: new Date(),
  comparisonPercentage: generateComparisonPercentage(),
  notAlonePercentage: generateNotAlonePercentage(),
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    ...defaultData,
    // Generate fresh random percentages for each session
    comparisonPercentage: generateComparisonPercentage(),
    notAlonePercentage: generateNotAlonePercentage(),
  });
  const { user } = useAuth();

  // Reset onboarding data when user signs out
  useEffect(() => {
    if (!user) {
      console.log('🧹 User signed out, clearing onboarding data');
      setData({
        ...defaultData,
        comparisonPercentage: generateComparisonPercentage(),
        notAlonePercentage: generateNotAlonePercentage(),
      });
    }
  }, [user]);

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => {
      const updatedData = {
        ...prev,
        quitReasons: [...prev.quitReasons],
        financialGoal: { ...prev.financialGoal }
      };

      // Handle string fields
      if (typeof newData.name === 'string') {
        updatedData.name = newData.name;
      }
      if (typeof newData.drinkingFrequency === 'string') {
        updatedData.drinkingFrequency = newData.drinkingFrequency;
      }
      if (typeof newData.drinksPerSession === 'string') {
        updatedData.drinksPerSession = newData.drinksPerSession;
      }
      if (typeof newData.currency === 'string') {
        updatedData.currency = newData.currency;
      }

      // Handle number fields
      if (typeof newData.weeklySpend === 'number') {
        updatedData.weeklySpend = newData.weeklySpend;
      }

      // Handle quitDate
      if (newData.quitDate) {
        updatedData.quitDate = newData.quitDate;
      }

      // Handle quitReasons array
      if (Array.isArray(newData.quitReasons)) {
        updatedData.quitReasons = [...newData.quitReasons];
      }

      // Handle financial goal
      if (newData.financialGoal) {
        updatedData.financialGoal = {
          description: newData.financialGoal.description ?? updatedData.financialGoal.description,
          amount: newData.financialGoal.amount ?? updatedData.financialGoal.amount,
        };
      }

      return updatedData;
    });
  };

  const resetData = () => {
    setData({
      ...defaultData,
      comparisonPercentage: generateComparisonPercentage(),
      notAlonePercentage: generateNotAlonePercentage(),
    });
  };

  // Computed values for financial projections
  const yearlySpend = data.weeklySpend * 52;
  const fiveYearSpend = yearlySpend * 5;
  const ninetyDaySavings = Math.round((data.weeklySpend / 7) * 90);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        resetData,
        yearlySpend,
        fiveYearSpend,
        ninetyDaySavings,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    console.error('❌ useOnboarding must be used within an OnboardingProvider');
    // Return a safe default instead of throwing
    return {
      data: defaultData,
      updateData: () => {},
      resetData: () => {},
      yearlySpend: 0,
      fiveYearSpend: 0,
      ninetyDaySavings: 0,
    };
  }
  return context;
} 