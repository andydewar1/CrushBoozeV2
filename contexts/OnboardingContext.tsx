import React, { createContext, useContext, useState } from 'react';

interface VapeType {
  type: 'disposable' | 'pod' | 'liquid' | 'other';
  otherText?: string;
  quantity: number;
  frequency: 'day' | 'week';
  unitCost: number;
}

interface OnboardingData {
  quitDate: Date | null;
  hasQuit: boolean;
  personalGoals: string[];
  quitReasons: string[];
  vapeTypes: VapeType[];
  currency: string;
  quitReason: string;
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
}

const defaultData: OnboardingData = {
  quitDate: null,
  hasQuit: false,
  personalGoals: [],
  quitReasons: [],
  vapeTypes: [],
  currency: 'USD',
  quitReason: '',
  financialGoal: {
    description: '',
    amount: 0,
  },
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => {
      // If updating vapeTypes, ensure we migrate any existing data
      if (newData.vapeTypes) {
        newData.vapeTypes = newData.vapeTypes.map(type => {
          // Ensure all required fields exist
          return {
            type: type.type || 'other',
            quantity: type.quantity || 0,
            frequency: type.frequency || 'day',
            unitCost: type.unitCost || 0,
            otherText: type.type === 'other' ? type.otherText : undefined,
          };
        });
      }
      return { ...prev, ...newData };
    });
  };

  const addVapeType = (vapeType: VapeType) => {
    setData(prev => ({
      ...prev,
      vapeTypes: [...prev.vapeTypes, {
        type: vapeType.type,
        quantity: vapeType.quantity || 0,
        frequency: vapeType.frequency || 'day',
        unitCost: vapeType.unitCost || 0,
        otherText: vapeType.type === 'other' ? vapeType.otherText : undefined,
      }],
    }));
  };

  const updateVapeType = (index: number, vapeType: Partial<VapeType>) => {
    setData(prev => ({
      ...prev,
      vapeTypes: prev.vapeTypes.map((type, i) =>
        i === index ? {
          ...type,
          ...vapeType,
          // Ensure otherText is only set for 'other' type
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

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        addVapeType,
        updateVapeType,
        removeVapeType,
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