import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface VapeType {
  type: 'disposable' | 'pod' | 'liquid' | 'other';
  otherText?: string;
  quantity: number;
  frequency: 'day' | 'week';
  unitCost: number;
}

interface OnboardingData {
  quitDate: Date;  // Changed from Date | null to Date
  hasQuit: boolean;
  personalGoals: string[];
  quitReasons: string[];
  quitReason: string;
  vapeTypes: VapeType[];
  currency: string;
  financialGoal: {
    description: string;
    amount: number;
  };
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  addVapeType: (vapeType: VapeType) => void;
  updateVapeType: (index: number, vapeType: Partial<VapeType>) => void;
  removeVapeType: (index: number) => void;
  resetData: () => void;
}

const defaultData: OnboardingData = {
  quitDate: new Date(),  // Initialize with current date
  hasQuit: false,
  personalGoals: [],
  quitReasons: [],
  quitReason: '',
  vapeTypes: [],
  currency: 'USD',
  financialGoal: {
    description: '',
    amount: 0,
  },
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const { user } = useAuth();

  // Reset onboarding data when user signs out
  useEffect(() => {
    if (!user) {
      console.log('🧹 User signed out, clearing onboarding data');
      setData(defaultData);
    }
  }, [user]);

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => {
      // Create a deep copy of the previous state
      const updatedData = {
        ...prev,
        personalGoals: [...prev.personalGoals],
        quitReasons: [...prev.quitReasons],
        vapeTypes: prev.vapeTypes.map(vt => ({ ...vt })),
        financialGoal: { ...prev.financialGoal }
      };

      // Handle hasQuit update
      if (newData.hasQuit !== undefined) {
        updatedData.hasQuit = newData.hasQuit;
      }

      // Handle quitDate update independently
      if (newData.quitDate) {
        updatedData.quitDate = newData.quitDate;
      }

      // Handle arrays with proper validation
      if (Array.isArray(newData.personalGoals)) {
        updatedData.personalGoals = [...newData.personalGoals];
      }

      if (Array.isArray(newData.quitReasons)) {
        updatedData.quitReasons = [...newData.quitReasons];
      }

      // Handle vape types with validation
      if (Array.isArray(newData.vapeTypes)) {
        updatedData.vapeTypes = newData.vapeTypes.map(vt => ({
          type: vt.type || 'other',
          quantity: vt.quantity || 0,
          frequency: vt.frequency || 'day',
          unitCost: vt.unitCost || 0,
          otherText: vt.type === 'other' ? vt.otherText : undefined,
        }));
      }

      // Handle financial goal with validation
      if (newData.financialGoal) {
        updatedData.financialGoal = {
          description: newData.financialGoal.description || updatedData.financialGoal.description,
          amount: newData.financialGoal.amount || updatedData.financialGoal.amount,
        };
      }

      // Handle primitive fields
      if (typeof newData.quitReason === 'string') {
        updatedData.quitReason = newData.quitReason;
      }

      if (typeof newData.currency === 'string') {
        updatedData.currency = newData.currency;
      }

      return updatedData;
    });
  };

  const addVapeType = (vapeType: VapeType) => {
    setData(prev => ({
      ...prev,
      vapeTypes: [
        ...prev.vapeTypes,
        {
          type: vapeType.type,
          quantity: vapeType.quantity || 0,
          frequency: vapeType.frequency || 'day',
          unitCost: vapeType.unitCost || 0,
          otherText: vapeType.type === 'other' ? vapeType.otherText : undefined,
        }
      ],
    }));
  };

  const updateVapeType = (index: number, vapeType: Partial<VapeType>) => {
    setData(prev => ({
      ...prev,
      vapeTypes: prev.vapeTypes.map((type, i) =>
        i === index ? {
          ...type,
          ...vapeType,
          otherText: vapeType.type === 'other' ? vapeType.otherText || type.otherText : undefined,
        } : type
      ),
    }));
  };

  const removeVapeType = (index: number) => {
    setData(prev => ({
      ...prev,
      vapeTypes: prev.vapeTypes.filter((_, i) => i !== index),
    }));
  };

  const resetData = () => {
    setData(defaultData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        addVapeType,
        updateVapeType,
        removeVapeType,
        resetData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 