import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

const STEPS = [
  'Analysing your drinking pattern...',
  'Calculating your potential savings...',
  'Preparing your personalised plan...',
];

export default function AnalyzingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [isComplete, setIsComplete] = useState(false);

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

    // Auto-navigate after animation completes
    setTimeout(() => {
      setIsComplete(true);
    }, STEPS.length * stepDuration + 500);
  }, []);

  useEffect(() => {
    if (isComplete) {
      router.push('/onboarding/summary');
    }
  }, [isComplete]);

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
      canContinue={isComplete}
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
