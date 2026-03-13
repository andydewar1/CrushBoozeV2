import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Brain, Music, Gamepad2, Phone, Settings, Play, Pause, MessageCircle } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useQuitMotivation } from '@/hooks/useQuitMotivation';

export default function SOSScreen() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState(0); // 0: inhale, 1: hold, 2: exhale, 3: hold
  const [count, setCount] = useState(4);
  const scaleAnim = useRef(new Animated.Value(1.0)).current;
  const phaseTimer = useRef<number | null>(null);
  const countTimer = useRef<number | null>(null);
  const { motivation, loading: motivationLoading, error: motivationError } = useQuitMotivation();

  const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
  const phaseInstructions = [
    'Inhale slowly through your nose',
    'Hold your breath',
    'Exhale slowly through your mouth',
    'Hold and prepare for next breath'
  ];

  useEffect(() => {
    if (isActive) {
      startBreathingCycle();
    } else {
      stopBreathingCycle();
    }

    return () => {
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
      if (countTimer.current) clearInterval(countTimer.current);
    };
  }, [isActive]);

  const startBreathingCycle = () => {
    setPhase(0);
    setCount(4);
    runPhase(0);
  };

  const stopBreathingCycle = () => {
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    if (countTimer.current) clearInterval(countTimer.current);
    
    // Reset to initial state
    Animated.timing(scaleAnim, {
      toValue: 1.0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setPhase(0);
    setCount(4);
  };

  const runPhase = (currentPhase: number) => {
    if (!isActive) return;

    setPhase(currentPhase);
    setCount(4);

    // Animate circle based on phase
    const targetScale = currentPhase === 0 || currentPhase === 1 ? 1.2 : 1.0; // Grow on inhale/hold, return to normal on exhale/hold
    
    Animated.timing(scaleAnim, {
      toValue: targetScale,
      duration: currentPhase === 0 || currentPhase === 2 ? 4000 : 0, // 4 seconds for inhale/exhale, instant for holds
      useNativeDriver: true,
    }).start();

    // Start countdown
    let currentCount = 4;
    countTimer.current = setInterval(() => {
      currentCount -= 1;
      setCount(currentCount);
      
      if (currentCount === 0) {
        if (countTimer.current) clearInterval(countTimer.current);
        
        // Move to next phase
        const nextPhase = (currentPhase + 1) % 4;
        phaseTimer.current = setTimeout(() => {
          runPhase(nextPhase);
        }, 100);
      }
    }, 1000);
  };

  const toggleBreathing = () => {
    setIsActive(!isActive);
  };

  const resetBreathing = () => {
    setIsActive(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>SOS</Text>
            <Text style={styles.pageSubtitle}>Pause. Breathe. You've got this.</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Box Breathing Exercise */}
        <View style={styles.breathingSection}>
          <View style={styles.breathingHeader}>
            <Text style={styles.breathingEmoji}>🧘</Text>
            <Text style={styles.breathingTitle}>Box Breathing Exercise</Text>
          </View>
          <Text style={styles.breathingSubtitle}>Calm your mind and reduce cravings</Text>

          <View style={styles.breathingContainer}>
            <TouchableOpacity style={styles.breathingCircle} onPress={toggleBreathing}>
              <Animated.View 
                style={[
                  styles.animatedCircle,
                  {
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <View style={styles.breathingInner}>
                  {isActive ? (
                    <>
                      <Text style={styles.breathingPhaseText}>{phases[phase]}</Text>
                      <Text style={styles.breathingCountText}>{count}</Text>
                    </>
                  ) : (
                    <Play size={40} color="#FFFFFF" />
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>

          <Text style={styles.breathingInstructions}>
            Focus on your breath and let the craving pass.
          </Text>
        </View>

        {/* Remember Your Why Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Remember Your Why</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Your personal motivation</Text>
          
          {motivationError || !motivation ? (
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationText}>
                {motivationError ? 'Complete onboarding to see your motivation' : 'No motivation set yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.motivationContainer}>
              {/* Custom Quit Reason */}
              <View style={styles.customReasonContainer}>
                <Text style={styles.customReasonTitle}>Your Personal Why</Text>
                <Text style={styles.customReasonText}>"{motivation.quitReason}"</Text>
              </View>

              {/* Personal Goals */}
              {motivation.personalGoals.length > 0 && (
                <View style={styles.goalsContainer}>
                  <Text style={styles.goalsTitle}>Your Goals</Text>
                  <View style={styles.goalsList}>
                    {motivation.personalGoals.map((goal, index) => (
                      <View key={index} style={styles.goalTag}>
                        <Text style={styles.goalTagText}>{goal.charAt(0).toUpperCase() + goal.slice(1)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Quit Reasons */}
              {motivation.quitReasons.length > 0 && (
                <View style={styles.reasonsContainer}>
                  <Text style={styles.reasonsTitle}>Your Reasons</Text>
                  <View style={styles.reasonsList}>
                    {motivation.quitReasons.map((reason, index) => (
                      <View key={index} style={styles.reasonItem}>
                        <Text style={styles.reasonText}>• {reason}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Quick Distraction Techniques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Distraction Techniques</Text>
          <Text style={styles.sectionSubtitle}>Redirect your mind when cravings hit.</Text>

          <View style={styles.techniquesGrid}>
            <TouchableOpacity style={styles.techniqueCard}>
              <Brain size={24} color="#03045e" />
              <Text style={styles.techniqueTitle}>5-4-3-2-1 Grounding</Text>
              <Text style={styles.techniqueDescription}>
                Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.techniqueCard}>
              <Music size={24} color="#03045e" />
              <Text style={styles.techniqueTitle}>Listen to Music</Text>
              <Text style={styles.techniqueDescription}>
                Put on your favorite song and focus on the lyrics or melody.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.techniqueCard}>
              <Gamepad2 size={24} color="#03045e" />
              <Text style={styles.techniqueTitle}>Play a Game</Text>
              <Text style={styles.techniqueDescription}>
                Engage your mind with a quick mobile game or puzzle.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.techniqueCard}>
              <Phone size={24} color="#03045e" />
              <Text style={styles.techniqueTitle}>Call Someone</Text>
              <Text style={styles.techniqueDescription}>
                Reach out to a friend, family member, or support person.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 90,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.1)',
  },
  breathingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breathingEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  breathingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  breathingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  breathingContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 32,
  },

  breathingCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#03045e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#03045e',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 16,
  },
  breathingInner: {
    width: 155,
    height: 155,
    borderRadius: 77.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  breathingPhaseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  breathingCountText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  breathingInstructions: {
    fontSize: 22,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 28,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
  },
  techniquesGrid: {
    gap: 12,
  },
  techniqueCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(3, 4, 94, 0.08)',
  },
  techniqueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 4,
  },
  techniqueDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  motivationContainer: {
    marginTop: 0,
  },
  motivationText: {
    fontSize: 16,
    color: '#03045e',
    fontWeight: '500',
  },
  customReasonContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  customReasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  customReasonText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  goalsContainer: {
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  goalsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    backgroundColor: '#03045e',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  reasonsContainer: {
    marginBottom: 8,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    paddingVertical: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
});