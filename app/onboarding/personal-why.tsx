import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_STEPS = 25;

// Non-linear progress: starts at ~25%, moves fast early, slows down later
const calculateProgress = (current: number, total: number): number => {
  const linearProgress = current / total;
  return 20 + (80 * Math.pow(linearProgress, 0.6));
};

export default function PersonalWhyScreen() {
  const { data, updateData } = useOnboarding();
  const [personalWhy, setPersonalWhy] = useState(data.personalWhy || '');

  const handleContinue = () => {
    updateData({ personalWhy });
    router.push('/onboarding/reasons-validation');
  };

  // Progress calculation (non-linear)
  const progress = calculateProgress(14, TOTAL_STEPS);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Now write your personal why.</Text>
          <Text style={styles.subtitle}>
            This is your anchor. When things get tough, you'll come back to this. Make it real. Make it yours.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="I want to quit drinking because..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={200}
              value={personalWhy}
              onChangeText={setPersonalWhy}
              autoFocus
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{personalWhy.length}/200</Text>
          </View>

          <Text style={styles.hint}>
            💡 Tip: Think about the people you love, the life you want, or the person you're becoming.
          </Text>
        </View>

        {/* Bottom button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={[styles.continueButton, !personalWhy.trim() && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!personalWhy.trim()}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#caf0f8',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 26,
    marginBottom: 32,
  },
  inputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    minHeight: 150,
  },
  textInput: {
    fontSize: 18,
    color: '#1A1A2E',
    lineHeight: 26,
    flex: 1,
    minHeight: 100,
  },
  charCount: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  hint: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 20,
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  continueButton: {
    backgroundColor: '#03045e',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
