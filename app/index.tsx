import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Platform, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { checkSubscriptionStatus, initializeRevenueCatIfNeeded } from '@/lib/subscription';
import { useEffect, useState } from 'react';

export default function LandingScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useSettings();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // SECURE: Check subscription before allowing main app access
  useEffect(() => {
    const secureAuthenticatedUserRouting = async () => {
      if (!authLoading && !profileLoading && session && profile) {
        setIsCheckingSubscription(true);
        
        try {
          // Initialize RevenueCat and check subscription
          await initializeRevenueCatIfNeeded(session.user.id);
          const isSubscribed = await checkSubscriptionStatus();
          
          if (isSubscribed) {
            console.log('✅ User has subscription - routing to main app');
            router.replace('/(tabs)');
          } else {
            console.log('🚨 User has no subscription - routing to paywall');
            router.replace('/paywall');
          }
        } catch (error) {
          console.error('❌ Subscription check failed - routing to paywall:', error);
          router.replace('/paywall');
        } finally {
          setIsCheckingSubscription(false);
        }
      }
    };

    secureAuthenticatedUserRouting();
  }, [session, profile, authLoading, profileLoading, router]);

  const handleGetStarted = async () => {
    // Don't redirect if still loading auth or profile data
    if (authLoading || profileLoading || isCheckingSubscription) {
      return;
    }
    
    if (session) {
      if (profile) {
        // User has completed onboarding - check subscription
        setIsCheckingSubscription(true);
        
        try {
          await initializeRevenueCatIfNeeded(session.user.id);
          const isSubscribed = await checkSubscriptionStatus();
          
          if (isSubscribed) {
            router.replace('/(tabs)');
          } else {
            router.replace('/paywall');
          }
        } catch (error) {
          router.replace('/paywall');
        } finally {
          setIsCheckingSubscription(false);
        }
      } else {
        // User is authenticated but hasn't completed onboarding
        router.push('/onboarding/quit-date');
      }
    } else {
      router.push('/auth/signup');
    }
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  // Show loading while checking subscription for authenticated users
  if ((!authLoading && !profileLoading && session && profile) || isCheckingSubscription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>
          {isCheckingSubscription ? 'Validating subscription...' : 'Loading...'}
        </Text>
      </View>
    );
  }

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

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, (authLoading || profileLoading || isCheckingSubscription) && styles.buttonDisabled]}
                  onPress={handleGetStarted}
                  disabled={authLoading || profileLoading || isCheckingSubscription}
                >
                  <Text style={styles.buttonText}>
                    {isCheckingSubscription ? 'Checking...' : 'Get Started'}
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
  buttonContainer: {
    width: '100%',
    gap: 16,
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#35998d',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 