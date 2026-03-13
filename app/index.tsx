import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

import { useEffect } from 'react';

export default function LandingScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useSettings();

  // AUTOMATIC ROUTING: Existing users should not see landing page
  useEffect(() => {
    const autoRoute = async () => {
      console.log('🔍 [LANDING] Auto-route check:', {
        authLoading,
        profileLoading,
        hasSession: !!session,
        hasProfile: !!profile,
        sessionId: session?.user?.id,
      });

      // Wait for auth and profile data to load
      if (authLoading || profileLoading) {
        console.log('⏳ [LANDING] Still loading, waiting...');
        return;
      }

      if (session && profile) {
        // Existing user with completed onboarding - route to main app
        // Let useSubscriptionGate handle subscription validation to avoid double paywall loading
        console.log('🔄 Auto-routing existing user to main app (subscription gate will validate)');
        router.replace('/(tabs)');
      } else if (session && !profile) {
        console.log('⚠️ [LANDING] User is authenticated but has no profile (onboarding incomplete)');
      } else {
        console.log('ℹ️ [LANDING] No session - staying on landing page');
      }
      // New users or incomplete onboarding users stay on landing page
    };

    autoRoute();
  }, [session, profile, authLoading, profileLoading, router]);

  // SECURITY FIX: Removed automatic background routing - all users must go through paywall validation

  const handleGetStarted = async () => {
    // Don't redirect if still loading auth or profile data
    if (authLoading || profileLoading) {
      console.log('⏳ [GET STARTED] Still loading, ignoring button press');
      return;
    }
    
    console.log('👆 [GET STARTED] Button pressed:', {
      hasSession: !!session,
      hasProfile: !!profile,
    });
    
    if (session) {
      if (profile) {
        // User has completed onboarding - route to main app
        // Let useSubscriptionGate handle subscription validation to avoid double paywall loading
        console.log('🔄 Routing existing user to main app (subscription gate will validate)');
        router.replace('/(tabs)');
      } else {
        // User is authenticated but hasn't completed onboarding
        console.log('🎯 Routing to onboarding (no profile found)');
        router.push('/onboarding/name');
      }
    } else {
      console.log('🆕 No session - routing to signup');
      router.push('/auth/signup');
    }
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  // REMOVED: No more automatic loading screen for subscription validation
  // Show landing page immediately while background check happens

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
              <View style={styles.messageContainer}>
                <Text style={styles.title}>It's time to take{'\n'}back control.</Text>
                <Text style={styles.subtitle}>Your alcohol-free journey starts here.</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, (authLoading || profileLoading) && styles.buttonDisabled]}
                  onPress={handleGetStarted}
                  disabled={authLoading || profileLoading}
                >
                  <Text style={styles.buttonText}>
                    Get Started
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleSignIn}
                >
                  <Text style={styles.linkText}>
                    Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
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
  messageContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 44,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginTop: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: '#03045e',
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 