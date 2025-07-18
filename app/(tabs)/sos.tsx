import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Brain, Music, Gamepad2, Phone, Settings } from 'lucide-react-native';

export default function SOSScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>SOS</Text>
            <Text style={styles.pageSubtitle}>Pause. Breathe. You've got this.</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
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
            <TouchableOpacity style={styles.resetButton}>
              <RotateCcw size={20} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.breathingCircle}>
              <View style={styles.breathingInner}>
                <Text style={styles.breathingPhaseText}>Breathe In</Text>
                <Text style={styles.breathingCountText}>4</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.breathingInstructions}>
            Focus on your breath and let the craving pass.
          </Text>
        </View>

        {/* Quick Distraction Techniques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Distraction Techniques</Text>
          <Text style={styles.sectionSubtitle}>Redirect your mind when cravings hit.</Text>

          <View style={styles.techniquesGrid}>
            <TouchableOpacity style={styles.techniqueCard}>
              <Brain size={24} color="#35998d" />
              <Text style={styles.techniqueTitle}>5-4-3-2-1 Grounding</Text>
              <Text style={styles.techniqueDescription}>
                Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.techniqueCard}>
              <Music size={24} color="#35998d" />
              <Text style={styles.techniqueTitle}>Listen to Music</Text>
              <Text style={styles.techniqueDescription}>
                Put on your favorite song and focus on the lyrics or melody.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.techniqueCard}>
              <Gamepad2 size={24} color="#35998d" />
              <Text style={styles.techniqueTitle}>Play a Game</Text>
              <Text style={styles.techniqueDescription}>
                Engage your mind with a quick mobile game or puzzle.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.techniqueCard}>
              <Phone size={24} color="#35998d" />
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
    borderColor: 'rgba(53, 153, 141, 0.1)',
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
  resetButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#35998d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#35998d',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 16,
  },
  breathingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
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
    borderColor: 'rgba(53, 153, 141, 0.08)',
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
});