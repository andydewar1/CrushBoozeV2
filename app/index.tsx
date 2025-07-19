import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/quit-date');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/landing-background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.spacer} />
            
            <View style={styles.mainContent}>
              <Image
                source={require('@/assets/images/CrushNic Logo (2).png')}
                style={styles.logo}
                resizeMode="contain"
              />
              
              <View style={styles.messageContainer}>
                <Text style={styles.title}>Ready to Quit{'\n'}for Good?</Text>
                <Text style={styles.subtitle}>Let's Crush This.</Text>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleGetStarted}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  spacer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    width: 280,
    height: 56,
    tintColor: '#FFFFFF',
    marginBottom: 24,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: '#35998D',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
}); 