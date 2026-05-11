import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain, Music, Gamepad2, Phone, Settings, Play, MessageCircle, Plus, Flame } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useQuitMotivation } from '@/hooks/useQuitMotivation';

const BREATH_ENCOURAGEMENTS = [
  'You got this.',
  'Stay with it.',
  "Keep going - you're OK.",
  'Strong move.',
  'One breath - one beat.',
  'Ride it out.',
  'Breathe - stay here.',
  'Small wins add up.',
];

const TAP_TARGET = 50;
const POP_DOT_COUNT = 9;

type SosToolkitMode = 'breathe' | 'tap50' | 'popGrid' | 'burnBox';

const CRAVING_BEAT_TITLE = 'Congratulations! 🎉';
const CRAVING_BEAT_LINES = [
  'Every urge you beat',
  'is a step toward a better you.',
];

export default function SOSScreen() {
  const router = useRouter();
  const [toolkitMode, setToolkitMode] = useState<SosToolkitMode>('breathe');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);
  const [encouragementIndex, setEncouragementIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [poppedDots, setPoppedDots] = useState<boolean[]>(() => Array(POP_DOT_COUNT).fill(false));
  const [showBreathBeatCongrats, setShowBreathBeatCongrats] = useState(false);
  const [burnText, setBurnText] = useState('');
  const [burnedMessageVisible, setBurnedMessageVisible] = useState(false);
  const [burnVentComplete, setBurnVentComplete] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1.0)).current;
  const phaseTimer = useRef<number | null>(null);
  const countTimer = useRef<number | null>(null);
  const skipNextEncouragementBump = useRef(false);
  const { motivation, error: motivationError } = useQuitMotivation();

  const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];

  useEffect(() => {
    if (!isActive) return;
    if (skipNextEncouragementBump.current) {
      skipNextEncouragementBump.current = false;
      return;
    }
    setEncouragementIndex(i => (i + 1) % BREATH_ENCOURAGEMENTS.length);
  }, [phase, isActive]);

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

    const targetScale = currentPhase === 0 || currentPhase === 1 ? 1.2 : 1.0;

    Animated.timing(scaleAnim, {
      toValue: targetScale,
      duration: currentPhase === 0 || currentPhase === 2 ? 4000 : 0,
      useNativeDriver: true,
    }).start();

    let currentCount = 4;
    countTimer.current = setInterval(() => {
      currentCount -= 1;
      setCount(currentCount);

      if (currentCount === 0) {
        if (countTimer.current) clearInterval(countTimer.current);

        const nextPhase = (currentPhase + 1) % 4;
        phaseTimer.current = setTimeout(() => {
          runPhase(nextPhase);
        }, 100);
      }
    }, 1000);
  };

  const toggleBreathing = () => {
    if (isActive) {
      setShowBreathBeatCongrats(true);
      setIsActive(false);
    } else {
      setShowBreathBeatCongrats(false);
      setEncouragementIndex(0);
      skipNextEncouragementBump.current = true;
      setIsActive(true);
    }
  };

  const switchToolkitMode = (mode: SosToolkitMode) => {
    if (mode === toolkitMode) return;
    setIsActive(false);
    setShowBreathBeatCongrats(false);
    if (mode === 'popGrid') {
      setPoppedDots(Array(POP_DOT_COUNT).fill(false));
    }
    if (mode === 'burnBox') {
      setBurnVentComplete(false);
    }
    setToolkitMode(mode);
  };

  const popDot = (index: number) => {
    setPoppedDots(prev => {
      if (prev[index] || prev.every(Boolean)) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const resetPopGrid = () => setPoppedDots(Array(POP_DOT_COUNT).fill(false));

  const allDotsPopped = poppedDots.every(Boolean);

  const onTapFifty = () => {
    setTapCount(c => (c >= TAP_TARGET ? c : c + 1));
  };

  const resetTapCounter = () => setTapCount(0);

  const cravingBeatComplete = (
    <>
      <View style={styles.pauseCongratsBlock}>
        <Text style={styles.pauseCongratsTitle}>{CRAVING_BEAT_TITLE}</Text>
        {CRAVING_BEAT_LINES.map((line, i) => (
          <Text key={i} style={styles.pauseCongratsBody}>
            {line}
          </Text>
        ))}
      </View>
      <TouchableOpacity
        style={styles.logUrgeButton}
        onPress={() => router.push('/logs')}
        activeOpacity={0.88}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.logUrgeButtonText}>Log urge</Text>
      </TouchableOpacity>
    </>
  );

  const burnIt = () => {
    setBurnText('');
    setBurnedMessageVisible(true);
    setBurnVentComplete(true);
    setTimeout(() => setBurnedMessageVisible(false), 1800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>SOS</Text>
            <Text style={styles.pageSubtitle}>Pause. Breathe. You've got this.</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Settings size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.breathingSection}>
          <View style={styles.breathingHeader}>
            <Text style={styles.breathingEmoji}>🧘</Text>
            <Text style={styles.breathingTitle}>Ride the urge</Text>
          </View>
          <Text style={styles.breathingSubtitle}>
            Urges peak and ease.
            {'\n'}
            Use whatever helps right now.
          </Text>

          <View style={styles.toolkitSegment}>
            <TouchableOpacity
              style={[styles.toolkitSegmentFourth, toolkitMode === 'breathe' && styles.toolkitSegmentFourthOn]}
              onPress={() => switchToolkitMode('breathe')}
              activeOpacity={0.9}
            >
              <Text style={[styles.toolkitSegmentLabel, toolkitMode === 'breathe' && styles.toolkitSegmentLabelOn]}>
                Breathe
              </Text>
            </TouchableOpacity>
            <View style={styles.toolkitSegmentHairline} />
            <TouchableOpacity
              style={[styles.toolkitSegmentFourth, toolkitMode === 'tap50' && styles.toolkitSegmentFourthOn]}
              onPress={() => switchToolkitMode('tap50')}
              activeOpacity={0.9}
            >
              <Text style={[styles.toolkitSegmentLabel, toolkitMode === 'tap50' && styles.toolkitSegmentLabelOn]}>
                Tap 50
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolkitSegmentFourth, toolkitMode === 'popGrid' && styles.toolkitSegmentFourthOn]}
              onPress={() => switchToolkitMode('popGrid')}
              activeOpacity={0.9}
            >
              <Text style={[styles.toolkitSegmentLabel, toolkitMode === 'popGrid' && styles.toolkitSegmentLabelOn]}>
                Pop 9
              </Text>
            </TouchableOpacity>
            <View style={styles.toolkitSegmentHairline} />
            <TouchableOpacity
              style={[styles.toolkitSegmentFourth, toolkitMode === 'burnBox' && styles.toolkitSegmentFourthOn]}
              onPress={() => switchToolkitMode('burnBox')}
              activeOpacity={0.9}
            >
              <Text style={[styles.toolkitSegmentLabel, toolkitMode === 'burnBox' && styles.toolkitSegmentLabelOn]}>
                Burn Box
              </Text>
            </TouchableOpacity>
          </View>

          {toolkitMode === 'breathe' ? (
            <>
              <Text style={styles.toolkitModeHint}>Tap the circle - start or pause.</Text>
              <View style={styles.breathingContainer}>
                <TouchableOpacity style={styles.breathingCircle} onPress={toggleBreathing}>
                  <Animated.View
                    style={[
                      styles.animatedCircle,
                      {
                        transform: [{ scale: scaleAnim }],
                      },
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
              {showBreathBeatCongrats && !isActive ? cravingBeatComplete : null}
              <Text style={styles.breathingInstructions}>
                {isActive
                  ? BREATH_ENCOURAGEMENTS[encouragementIndex]
                  : showBreathBeatCongrats
                    ? 'Tap play - go again anytime.'
                    : "Urges ease in a few minutes.\nTap play - when you're ready."}
              </Text>
            </>
          ) : toolkitMode === 'tap50' ? (
            <>
              <Text style={styles.toolkitModeHint}>Tap 50 times - quick focus.</Text>
              <TouchableOpacity
                style={[styles.tapFiftyButton, tapCount >= TAP_TARGET && styles.tapFiftyButtonDone]}
                onPress={onTapFifty}
                activeOpacity={0.85}
                disabled={tapCount >= TAP_TARGET}
              >
                <Text style={styles.tapFiftyCount}>{tapCount >= TAP_TARGET ? '50' : tapCount}</Text>
                <Text style={styles.tapFiftySub}>
                  {tapCount >= TAP_TARGET ? 'All 50 - well done.' : `of ${TAP_TARGET} taps`}
                </Text>
              </TouchableOpacity>
              {tapCount >= TAP_TARGET ? cravingBeatComplete : null}
              {tapCount >= TAP_TARGET ? (
                <TouchableOpacity onPress={resetTapCounter} style={styles.tapFiftyReset} activeOpacity={0.8}>
                  <Text style={styles.tapFiftyResetText}>Start again</Text>
                </TouchableOpacity>
              ) : null}
              <Text style={styles.breathingInstructions}>
                {tapCount >= TAP_TARGET
                  ? 'Tap Start again for another round.'
                  : 'Keep tapping - stay with it.'}
              </Text>
            </>
          ) : toolkitMode === 'popGrid' ? (
            <>
              <Text style={styles.toolkitModeHint}>Tap each dot once - clear the grid.</Text>
              <View style={styles.popGrid}>
                {poppedDots.map((popped, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.popDot, popped && styles.popDotPopped]}
                    onPress={() => popDot(i)}
                    activeOpacity={0.85}
                    disabled={popped}
                  >
                    {popped ? (
                      <Text style={styles.popDotCheck}>✓</Text>
                    ) : (
                      <View style={styles.popDotInner} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.popGridProgress}>
                {allDotsPopped ? 'All clear!' : `${poppedDots.filter(Boolean).length} / ${POP_DOT_COUNT}`}
              </Text>
              {allDotsPopped ? (
                <>
                  {cravingBeatComplete}
                  <TouchableOpacity onPress={resetPopGrid} style={styles.tapFiftyReset} activeOpacity={0.8}>
                    <Text style={styles.tapFiftyResetText}>Play again</Text>
                  </TouchableOpacity>
                  <Text style={styles.breathingInstructions}>Play again anytime you need a reset.</Text>
                </>
              ) : (
                <Text style={styles.breathingInstructions}>One dot at a time - no rush.</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.toolkitModeHint}>
                Let it all out. Use the burn box to vent. Nothing here is saved and it disappears the moment you burn it.
              </Text>
              {burnVentComplete ? (
                <>
                  <Text style={styles.burnedMessageAfterBurn}>Burned. Let it go.</Text>
                  {cravingBeatComplete}
                  <TouchableOpacity
                    onPress={() => setBurnVentComplete(false)}
                    style={styles.tapFiftyReset}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tapFiftyResetText}>Vent again</Text>
                  </TouchableOpacity>
                  <Text style={styles.breathingInstructions}>Write and burn anytime you need to let it out.</Text>
                </>
              ) : (
                <View style={styles.burnBoxCard}>
                  <Text style={styles.burnBoxHint}>Nothing written here is saved anywhere.</Text>
                  <TextInput
                    value={burnText}
                    onChangeText={setBurnText}
                    placeholder="Type it out and let it go..."
                    placeholderTextColor="#8E8E93"
                    multiline
                    textAlignVertical="top"
                    style={styles.burnBoxInput}
                    maxLength={1200}
                  />
                  <View style={styles.burnBoxFooter}>
                    <Text style={styles.burnBoxCount}>{burnText.length}/1200</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.burnCtaButton, burnText.trim().length === 0 && styles.burnCtaButtonDisabled]}
                    onPress={burnIt}
                    disabled={burnText.trim().length === 0}
                    activeOpacity={0.88}
                  >
                    <Flame size={20} color="#FFFFFF" />
                    <Text style={styles.burnCtaButtonText}>Burn It</Text>
                  </TouchableOpacity>
                  {burnedMessageVisible ? <Text style={styles.burnedMessage}>Burned. Let it go.</Text> : null}
                </View>
              )}
            </>
          )}
        </View>

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
              <View style={styles.customReasonContainer}>
                <Text style={styles.customReasonTitle}>Your Personal Why</Text>
                <Text style={styles.customReasonText}>"{motivation.quitReason}"</Text>
              </View>

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
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Brain size={20} color="#03045e" />
            <Text style={styles.sectionTitle}>Quick Distraction Techniques</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Redirect your mind when urges hit.</Text>

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
    paddingBottom: 18,
  },
  titleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 22,
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
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    marginBottom: 20,
    alignItems: 'center',
    overflow: 'visible',
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    marginRight: 8,
  },
  breathingTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  breathingSubtitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  toolkitSegment: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(60, 60, 67, 0.07)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    width: '100%',
  },
  toolkitSegmentFourth: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 2,
    borderRadius: 11,
    minWidth: 0,
  },
  toolkitSegmentFourthOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  toolkitSegmentHairline: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
    alignSelf: 'stretch',
    marginVertical: 8,
  },
  toolkitSegmentLabel: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 11,
    fontWeight: '600',
    color: '#636366',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  toolkitSegmentLabelOn: {
    color: '#03045e',
  },
  toolkitModeHint: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  pauseCongratsBlock: {
    alignSelf: 'stretch',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  pauseCongratsTitle: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 22,
    fontWeight: '700',
    color: '#03045e',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  pauseCongratsBody: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  logUrgeButton: {
    alignSelf: 'stretch',
    backgroundColor: '#03045e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#03045e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logUrgeButtonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  popGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 12,
    maxWidth: 240,
    alignSelf: 'center',
  },
  popDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#03045e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#03045e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  popDotPopped: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  popDotInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  popDotCheck: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 24,
    fontWeight: '700',
    color: '#03045e',
  },
  popGridProgress: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  tapFiftyButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#03045e',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 14,
    shadowColor: '#03045e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  tapFiftyButtonDone: {
    backgroundColor: '#020338',
    shadowOpacity: 0.2,
  },
  tapFiftyCount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tapFiftySub: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
  },
  tapFiftyReset: {
    alignSelf: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tapFiftyResetText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 15,
    fontWeight: '600',
    color: '#03045e',
  },
  breathingContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
    justifyContent: 'center',
    paddingVertical: 20,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  breathingCountText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  breathingInstructions: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 26,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 4,
  },
  techniqueDescription: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  burnBoxCard: {
    width: '100%',
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(3, 4, 94, 0.12)',
  },
  burnBoxHint: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 10,
  },
  burnBoxInput: {
    fontFamily: FONT_FAMILY_UI,
    minHeight: 170,
    maxHeight: 260,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(3, 4, 94, 0.16)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 21,
  },
  burnBoxFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  burnBoxCount: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  burnCtaButton: {
    alignSelf: 'stretch',
    backgroundColor: '#D94B3D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#D94B3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  burnCtaButtonDisabled: {
    backgroundColor: '#E6A7A1',
    shadowOpacity: 0,
    elevation: 0,
  },
  burnCtaButtonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  burnedMessage: {
    fontFamily: FONT_FAMILY_UI,
    marginTop: 10,
    fontSize: 13,
    color: '#03045e',
    fontWeight: '600',
  },
  burnedMessageAfterBurn: {
    fontFamily: FONT_FAMILY_UI,
    alignSelf: 'center',
    marginBottom: 10,
    fontSize: 14,
    color: '#03045e',
    fontWeight: '700',
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
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  customReasonText: {
    fontFamily: FONT_FAMILY_UI,
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  goalsContainer: {
    marginBottom: 16,
  },
  goalsTitle: {
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
