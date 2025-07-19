import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function QuitReasonScreen() {
  const { data, updateData } = useOnboarding();

  const handleReasonChange = (text: string) => {
    updateData({ quitReason: text });
  };

  return (
    <OnboardingScreen
      title="What is your why?"
      subtitle="Write a message to yourself about why you want to quit - something to reflect on when times get hard"
      currentStep={6}
      totalSteps={7}
      nextScreen="/onboarding/financial-goal"
      previousScreen="/onboarding/costs"
      canProgress={data.quitReason.trim().length > 0}
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={data.quitReason}
            onChangeText={handleReasonChange}
            placeholder="Write your personal reason for quitting..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            multiline
            textAlignVertical="top"
            numberOfLines={6}
          />
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  input: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    minHeight: 120,
    lineHeight: 24,
  },
}); 