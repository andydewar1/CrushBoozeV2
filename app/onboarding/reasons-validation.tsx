import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';

const TOTAL_STEPS = 25;

export default function ReasonsValidationScreen() {
  const { data } = useOnboarding();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const [countValue, setCountValue] = useState(1);

  useEffect(() => {
    // Animate emoji
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

    // Animate count from 1 to 3
    const countInterval = setInterval(() => {
      setCountValue(prev => {
        if (prev >= 3) {
          clearInterval(countInterval);
          return 3;
        }
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(countInterval);
  }, []);

  const handleContinue = () => {
    router.push('/onboarding/financial-goal');
  };

  return (
    <OnboardingScreen
      currentStep={15}
      totalSteps={TOTAL_STEPS}
      title=""
      variant="dark"
      onContinue={handleContinue}
      continueText="Continue"
    >
      <View style={styles.content}>
        <Animated.Text 
          style={[
            styles.emoji, 
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          🎯
        </Animated.Text>

        <Text style={styles.text}>
          Those are powerful reasons, {data.name}.
        </Text>
        <Text style={styles.stat}>
          People who are clear about why they quit drinking are{' '}
          <Text style={styles.highlight}>{countValue}× more likely</Text>
          {' '}to succeed.
        </Text>
        <Text style={styles.subtext}>
          You're already ahead of most people.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  text: {
    fontSize: 26,
    color: '#FFFFFF',
    lineHeight: 36,
    fontWeight: '600',
    marginBottom: 24,
  },
  stat: {
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 32,
  },
  highlight: {
    color: '#caf0f8',
    fontWeight: '700',
  },
  subtext: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 24,
  },
});
