import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '@/components/OnboardingScreenNew';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { saveOnboardingData } from '@/lib/onboarding';

const TOTAL_STEPS = 25;

const STEPS = [
  'Analysing your drinking pattern...',
  'Calculating your potential savings...',
  'Preparing your personalised plan...',
];

export default function AnalyzingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [animationComplete, setAnimationComplete] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const { data } = useOnboarding();
  const { user } = useAuth();
  const saveAttempted = useRef(false);

  // Save data in background during animation with robust retry logic
  useEffect(() => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    const saveData = async () => {
      if (!user || saveAttempted.current) return;
      saveAttempted.current = true;

      console.log('💾 [ANALYZING] Saving onboarding data in background...');
      
      const onboardingData = {
        name: data.name || 'Friend',
        quitDate: data.quitDate instanceof Date ? data.quitDate : new Date(),
        weeklySpend: data.weeklySpend || 0,
        currency: data.currency || 'USD',
        quitReasons: data.quitReasons || [],
        personalWhy: data.personalWhy || '',
        financialGoal: data.financialGoal || { description: '', amount: 0 },
      };
      
      // Robust retry: 5 attempts with increasing delays (1s, 2s, 3s, 4s)
      let success = false;
      const maxAttempts = 5;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`💾 [ANALYZING] Save attempt ${attempt}/${maxAttempts}...`);
          const result = await saveOnboardingData(user.id, onboardingData);
          
          if (result.success) {
            console.log('✅ [ANALYZING] Onboarding data saved successfully!');
            success = true;
            break;
          } else {
            console.error(`❌ [ANALYZING] Attempt ${attempt}/${maxAttempts} failed:`, result.error);
            if (attempt < maxAttempts) {
              const delayMs = 1000 * attempt; // 1s, 2s, 3s, 4s
              console.log(`⏳ [ANALYZING] Waiting ${delayMs}ms before retry...`);
              await delay(delayMs);
            }
          }
        } catch (error) {
          console.error(`❌ [ANALYZING] Attempt ${attempt}/${maxAttempts} error:`, error);
          if (attempt < maxAttempts) {
            const delayMs = 1000 * attempt;
            console.log(`⏳ [ANALYZING] Waiting ${delayMs}ms before retry...`);
            await delay(delayMs);
          }
        }
      }
      
      if (!success) {
        console.error('❌ [ANALYZING] All save attempts failed - will retry after purchase');
      }
      
      setSaveComplete(true);
    };

    saveData();
  }, [user]);

  useEffect(() => {
    // Animate through the steps
    const stepDuration = 1200;
    
    STEPS.forEach((_, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        Animated.timing(progress, {
          toValue: (index + 1) / STEPS.length,
          duration: stepDuration - 200,
          useNativeDriver: false,
        }).start();
      }, index * stepDuration);
    });

    // Animation completes after all steps
    setTimeout(() => {
      setAnimationComplete(true);
    }, STEPS.length * stepDuration + 500);
  }, []);

  // Navigate when BOTH animation and save are complete
  useEffect(() => {
    if (animationComplete && saveComplete) {
      router.push('/onboarding/summary');
    }
  }, [animationComplete, saveComplete]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <OnboardingScreen
      currentStep={22}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={() => router.push('/onboarding/summary')}
      continueText="Continue"
      canContinue={animationComplete && saveComplete}
      showBackButton={false}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {STEPS.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[
                styles.dot,
                index <= currentStep && styles.dotActive,
              ]} />
              <Text style={[
                styles.stepText,
                index <= currentStep && styles.stepTextActive,
              ]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[styles.progressFill, { width: progressWidth }]} 
            />
          </View>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: 24,
    marginBottom: 60,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#caf0f8',
  },
  stepText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
    flex: 1,
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#caf0f8',
    borderRadius: 3,
  },
});
