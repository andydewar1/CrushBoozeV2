import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Platform } from 'react-native';
import { FONT_FAMILY_UI } from '@/lib/typography';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

import { useCallback } from 'react';
import RevenueCatService, { logWebFunnelRouting } from '@/services/RevenueCatService';
import { checkSubscriptionStatus } from '@/lib/subscription';

export default function LandingScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useSettings();

  const routeAuthenticatedUser = useCallback(async () => {
    if (!session) {
      logWebFunnelRouting('landing', { hasSession: false });
      return;
    }

    const userId = session.user.id;

    let onboardingCompleted = profile?.onboarding_completed === true;
    if (!onboardingCompleted) {
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle();
      onboardingCompleted = freshProfile?.onboarding_completed === true;
    }

    if (!onboardingCompleted) {
      logWebFunnelRouting('onboarding', {
        userId,
        hasProfile: !!profile,
        onboarding_completed: false,
      });
      router.replace('/onboarding/name');
      return;
    }

    for (let i = 0; i < 50 && !RevenueCatService.isInitialized(); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (RevenueCatService.isInitialized()) {
      await RevenueCatService.logInToRevenueCat(userId);
    }

    const isSubscribed = await checkSubscriptionStatus();
    if (isSubscribed) {
      logWebFunnelRouting('tabs', { userId });
      router.replace('/(tabs)');
    } else {
      logWebFunnelRouting('paywall', { userId });
      router.replace('/paywall');
    }
  }, [session, profile, router]);

  // Only auto-route when landing is focused (avoids flash while /auth/login is on screen)
  useFocusEffect(
    useCallback(() => {
      const autoRoute = async () => {
        console.log('🔍 [LANDING] Auto-route check:', {
          authLoading,
          profileLoading,
          hasSession: !!session,
          hasProfile: !!profile,
          onboarding_completed: profile?.onboarding_completed,
          sessionId: session?.user?.id,
        });

        if (authLoading || (session && profileLoading)) {
          console.log('⏳ [LANDING] Still loading, waiting...');
          return;
        }

        if (session) {
          await routeAuthenticatedUser();
        } else {
          logWebFunnelRouting('landing', { hasSession: false });
        }
      };

      autoRoute();
    }, [session, profile, authLoading, profileLoading, routeAuthenticatedUser])
  );

  // SECURITY FIX: Removed automatic background routing - all users must go through paywall validation

  const handleGetStarted = async () => {
    // Don't redirect if still loading auth or profile data
    if (authLoading || (session && profileLoading)) {
      console.log('⏳ [GET STARTED] Still loading, ignoring button press');
      return;
    }
    
    console.log('👆 [GET STARTED] Button pressed:', {
      hasSession: !!session,
      hasProfile: !!profile,
    });
    
    if (session) {
      await routeAuthenticatedUser();
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
    fontFamily: FONT_FAMILY_UI,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: FONT_FAMILY_UI,
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
    fontFamily: FONT_FAMILY_UI,
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    fontFamily: FONT_FAMILY_UI,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  linkTextBold: {
    fontFamily: FONT_FAMILY_UI,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 