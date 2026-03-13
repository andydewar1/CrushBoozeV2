import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

export default function CommitmentScreen() {
  const { data } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    // Navigate to paywall
    router.push('/paywall');
  };

  return (
    <OnboardingScreen
      currentStep={25}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="I'm ready"
      showBackButton={true}
    >
      <View style={styles.container}>
        <Animated.Text 
          style={[
            styles.emoji, 
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          💪
        </Animated.Text>

        <Text style={styles.name}>So {data.name}...</Text>
        <Text style={styles.question}>
          Are you ready to commit to your alcohol-free journey?
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  question: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 44,
  },
});
