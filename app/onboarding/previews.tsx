import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  NativeSyntheticEvent, 
  NativeScrollEvent,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ImageSourcePropType
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 25;

// Non-linear progress: starts at ~25%, moves fast early, slows down later
const calculateProgress = (current: number, total: number): number => {
  const linearProgress = current / total;
  return 20 + (80 * Math.pow(linearProgress, 0.6));
};

const previews: { image: ImageSourcePropType; title: string; subtitle: string }[] = [
  {
    image: require('@/assets/images/Dashboard.png'),
    title: 'Your Dashboard',
    subtitle: 'Track your progress in real time.',
  },
  {
    image: require('@/assets/images/Goals.png'),
    title: 'Financial Goals',
    subtitle: 'Turn your drinking money into real goals.',
  },
  {
    image: require('@/assets/images/SOS.png'),
    title: 'SOS Feature',
    subtitle: 'Break urges in seconds.',
  },
];

export default function PreviewsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleContinue = () => {
    router.push('/onboarding/analyzing');
  };

  const handleBack = () => {
    router.back();
  };

  // Progress calculation (non-linear)
  const progress = calculateProgress(19, TOTAL_STEPS);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>We've got your back.{'\n'}Here's your toolkit for change.</Text>
          <Text style={styles.subtitle}>{previews[activeIndex].subtitle}</Text>
        </View>

        {/* Swipeable Previews */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {previews.map((preview, index) => (
            <View key={index} style={styles.slide}>
              <View style={styles.screenshotContainer}>
                <Image 
                  source={preview.image} 
                  style={styles.screenshot}
                  resizeMode="contain"
                />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          {/* Pagination dots */}
          <View style={styles.pagination}>
            {previews.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Continue button - only show on last slide */}
          {activeIndex === previews.length - 1 ? (
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.swipeHint}>Swipe to explore →</Text>
          )}
        </View>
      </View>
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
    backgroundColor: '#FFFFFF',
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
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotContainer: {
    width: '100%',
    height: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshot: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  dotActive: {
    backgroundColor: '#03045e',
    width: 24,
  },
  swipeHint: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#03045e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
