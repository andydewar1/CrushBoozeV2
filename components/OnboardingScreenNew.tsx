import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Design tokens
const COLORS = {
  navy: '#03045e',
  lightBlue: '#caf0f8',
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  gray: '#E5E5E5',
  black: '#1A1A2E',
  textMuted: '#6B7280',
};

interface AnswerOption {
  emoji: string;
  text: string;
  value: string;
}

interface OnboardingScreenProps {
  // Progress
  currentStep: number;
  totalSteps: number;
  
  // Content
  title: string;
  subtitle?: string;
  
  // Variant
  variant?: 'light' | 'dark';
  
  // Answer options (for selection screens)
  options?: AnswerOption[];
  selectedValue?: string | string[];
  onSelect?: (value: string) => void;
  multiSelect?: boolean;
  
  // Custom content (for inputs, info screens, etc.)
  children?: ReactNode;
  
  // Navigation
  onContinue: () => void;
  continueText?: string;
  canContinue?: boolean;
  showBackButton?: boolean;
  
  // Keyboard handling
  hasInput?: boolean;
}

// Non-linear progress: starts at ~25%, moves fast early, slows down later
// Makes onboarding feel faster and less daunting
const calculateProgress = (current: number, total: number): number => {
  const linearProgress = current / total;
  // Start at 20%, use exponential curve for remaining 80%
  // Power of 0.6 makes early progress faster
  return 20 + (80 * Math.pow(linearProgress, 0.6));
};

export default function OnboardingScreen({
  currentStep,
  totalSteps,
  title,
  subtitle,
  variant = 'light',
  options,
  selectedValue,
  onSelect,
  multiSelect = false,
  children,
  onContinue,
  continueText = 'Continue',
  canContinue = true,
  showBackButton = true,
  hasInput = false,
}: OnboardingScreenProps) {
  const isDark = variant === 'dark';
  const progress = calculateProgress(currentStep, totalSteps);
  
  const handleSelect = (value: string) => {
    if (!onSelect) return;
    // Just pass the value - let parent handle array logic for multi-select
    onSelect(value);
  };
  
  const isSelected = (value: string) => {
    if (Array.isArray(selectedValue)) {
      return selectedValue.includes(value);
    }
    return selectedValue === value;
  };

  const content = (
    <>
      {/* Header with back button and progress */}
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? COLORS.white : COLORS.textMuted} 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : COLORS.gray }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: isDark ? COLORS.white : COLORS.lightBlue,
              }
            ]} 
          />
        </View>
      </View>
      
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[
          styles.title, 
          { color: isDark ? COLORS.white : COLORS.black }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[
            styles.subtitle,
            { color: isDark ? 'rgba(255,255,255,0.8)' : COLORS.textMuted }
          ]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {/* Options or custom content */}
      <View style={styles.contentContainer}>
        {options ? (
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  isSelected(option.value) && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.optionText,
                  isSelected(option.value) && styles.optionTextSelected,
                ]}>
                  {option.text}
                </Text>
                {isSelected(option.value) && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={COLORS.navy} 
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          children
        )}
      </View>
      
      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
            isDark && styles.continueButtonLight,
          ]}
          onPress={onContinue}
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueText,
            isDark && styles.continueTextDark,
          ]}>
            {continueText}
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={isDark ? COLORS.navy : COLORS.white}
            style={styles.continueIcon}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  const containerStyle = [
    styles.container,
    { backgroundColor: isDark ? COLORS.navy : COLORS.white }
  ];

  if (hasInput) {
    return (
      <SafeAreaView style={containerStyle}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 20,
    marginTop: 12,
    lineHeight: 30,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    fontSize: 17,
    color: COLORS.black,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonLight: {
    backgroundColor: COLORS.white,
  },
  continueText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  continueTextDark: {
    color: COLORS.navy,
  },
  continueIcon: {
    marginLeft: 8,
  },
});
