import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

type OnboardingScreenPath = 
  | '/onboarding/quit-date'
  | '/onboarding/goals'
  | '/onboarding/reasons'
  | '/onboarding/vape-types'
  | '/onboarding/usage'
  | '/onboarding/costs'
  | '/onboarding/quit-reason'
  | '/onboarding/financial-goal'
  | '/onboarding/summary'
  | '/(tabs)';

interface OnboardingScreenProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  nextScreen: OnboardingScreenPath;
  previousScreen?: OnboardingScreenPath;
  canProgress?: boolean;
  hideProgress?: boolean;
  scrollEnabled?: boolean;
}

export default function OnboardingScreen({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  nextScreen,
  previousScreen,
  canProgress = true,
  hideProgress,
  scrollEnabled = true,
}: OnboardingScreenProps) {
  const router = useRouter();

  const handleNext = () => {
    if (canProgress) {
      router.push(nextScreen as any);
    }
  };

  const handleBack = () => {
    if (previousScreen) {
      router.push(previousScreen as any);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={[]} style={styles.safeArea}>
        {!hideProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / totalSteps) * 100}%` }
                ]} 
              />
            </View>
          </View>
        )}

        <View style={styles.header}>
          {previousScreen && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>
            {children}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                (!canProgress || !nextScreen) && styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!canProgress || !nextScreen}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03045e',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#03045e',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#03045e',
  },
  content: {
    flex: 1,
    backgroundColor: '#03045e',
  },
  contentContainer: {
    padding: 20,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'left',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#03045e',
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#03045e',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 