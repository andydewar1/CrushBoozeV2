import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { usePaywall } from "@/hooks/usePaywall";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";

type Plan = "annual" | "monthly";

const NAVY = "#03045e";
const LIGHT_BLUE = "#caf0f8";
const WHITE = "#FFFFFF";
const GRAY = "#6B7280";

const TESTIMONIALS = [
  { quote: "CrushBooze really helped me in my sober journey. The tracking is really helpful and opened my eyes.", name: "Sarah", location: "London, UK" },
  { quote: "The breathing exercise really helped me beat the urges to drink.", name: "Marcus", location: "Chicago, USA" },
  { quote: "Seeing myself progress both in health and finance really helped me stay on track.", name: "Emma", location: "Sydney, Australia" },
];

export default function PaywallScreen() {
  const [plan, setPlan] = useState<Plan>("annual");
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const { packages, loading, purchasing, error, purchasePackage, restorePurchases, getPackageByType } = usePaywall();
  const { data, yearlySpend } = useOnboarding();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const testimonialAnim = useRef(new Animated.Value(1)).current;

  const { height } = Dimensions.get("window");
  const compact = height < 750;

  // Subtle pulse animation on CTA
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(testimonialAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        // Fade in
        Animated.timing(testimonialAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  const annualPackage = getPackageByType('ANNUAL');
  const monthlyPackage = getPackageByType('MONTHLY');

  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = {
      'GBP': '£', 'USD': '$', 'EUR': '€', 'CAD': 'C$', 'AUD': 'A$',
      'NZD': 'NZ$', 'CHF': 'CHF', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr',
      'PLN': 'zł', 'INR': '₹', 'JPY': '¥', 'CNY': '¥', 'BRL': 'R$', 'MXN': 'MX$',
    };
    return symbols[data.currency] || '£';
  };

  // Get actual prices from RevenueCat or use defaults
  const getAnnualPrice = () => {
    if (annualPackage?.product.price) return annualPackage.product.price;
    return 29.99;
  };
  
  const getMonthlyPrice = () => {
    if (monthlyPackage?.product.price) return monthlyPackage.product.price;
    return 9.99;
  };

  const annualWeeklyCost = (getAnnualPrice() / 52).toFixed(2);
  const monthlyWeeklyCost = (getMonthlyPrice() / 4.33).toFixed(2);

  const handlePurchase = async () => {
    const selectedPackage = plan === 'annual' ? annualPackage : monthlyPackage;
    if (selectedPackage) {
      await purchasePackage(selectedPackage);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.replace('/paywall')}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentTestimonial = TESTIMONIALS[testimonialIndex];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { marginTop: compact ? 8 : 16 }]}>
          <Text style={[styles.headline, { fontSize: compact ? 24 : 28 }]}>
            {data.name ? `${data.name}, your` : "Your"} personalised{"\n"}plan is ready
          </Text>
        </View>

        {/* Spending stat */}
        <View style={styles.spendCard}>
          <Text style={[styles.spendText, { fontSize: compact ? 15 : 17 }]}>
            You currently spend <Text style={styles.spendHighlight}>{getCurrencySymbol()}{yearlySpend.toLocaleString()}/year</Text> on alcohol
          </Text>
        </View>


        {/* Testimonial */}
        <View style={styles.testimonialSection}>
          <Animated.View style={[styles.testimonialCard, { opacity: testimonialAnim }]}>
            <Text style={[styles.testimonialQuote, { fontSize: compact ? 13 : 14 }]}>"{currentTestimonial.quote}"</Text>
            <Text style={styles.testimonialAuthor}>– {currentTestimonial.name}, {currentTestimonial.location}</Text>
          </Animated.View>
          <View style={styles.testimonialDots}>
            {TESTIMONIALS.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === testimonialIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* What's Included - Outcome focused */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={22} color={NAVY} />
              <Text style={[styles.benefitText, { fontSize: compact ? 15 : 16 }]}>Watch your progress grow in real-time</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={22} color={NAVY} />
              <Text style={[styles.benefitText, { fontSize: compact ? 15 : 16 }]}>See exactly how much money you're saving</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={22} color={NAVY} />
              <Text style={[styles.benefitText, { fontSize: compact ? 15 : 16 }]}>Get instant support when urges hit hardest</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={22} color={NAVY} />
              <Text style={[styles.benefitText, { fontSize: compact ? 15 : 16 }]}>Spot your triggers and break the patterns</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={22} color={NAVY} />
              <Text style={[styles.benefitText, { fontSize: compact ? 15 : 16 }]}>Set and crush your personal financial goals</Text>
            </View>
          </View>
        </View>

        {/* Plan Selection */}
        <View style={styles.plansSection}>
          {/* Annual Plan */}
          <Pressable
            onPress={() => setPlan("annual")}
            style={[styles.planCard, plan === "annual" && styles.planCardSelected]}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>MOST POPULAR</Text>
            </View>
            <View style={[styles.planContent, { paddingVertical: compact ? 8 : 12 }]}>
              <View style={styles.planRadio}>
                <View style={[styles.radioOuter, plan === "annual" && styles.radioOuterSelected]}>
                  {plan === "annual" && <View style={styles.radioInner} />}
                </View>
              </View>
              <View style={styles.planDetails}>
                <View style={styles.planNameRow}>
                  <Text style={[styles.planName, { fontSize: compact ? 15 : 17 }]}>Annual</Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>SAVE 75%</Text>
                  </View>
                </View>
                <Text style={[styles.planPrice, { fontSize: compact ? 13 : 15 }]}>
                  {annualPackage?.product.priceString || '£29.99'}/year · 3-day free trial
                </Text>
                <Text style={[styles.planSavings, { fontSize: compact ? 11 : 13 }]}>
                  Just {annualPackage?.product.currencyCode === 'GBP' ? '£' : annualPackage?.product.currencyCode === 'EUR' ? '€' : '$'}{annualWeeklyCost}/week · Cancel anytime
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Monthly Plan */}
          <Pressable
            onPress={() => setPlan("monthly")}
            style={[styles.planCard, plan === "monthly" && styles.planCardSelected]}
          >
            <View style={[styles.planContent, { paddingVertical: compact ? 8 : 12 }]}>
              <View style={styles.planRadio}>
                <View style={[styles.radioOuter, plan === "monthly" && styles.radioOuterSelected]}>
                  {plan === "monthly" && <View style={styles.radioInner} />}
                </View>
              </View>
              <View style={styles.planDetails}>
                <Text style={[styles.planName, { fontSize: compact ? 15 : 17 }]}>Monthly</Text>
                <Text style={[styles.planPrice, { fontSize: compact ? 13 : 15 }]}>
                  {monthlyPackage?.product.priceString || '£9.99'}/month · 3-day free trial
                </Text>
                <Text style={[styles.planSubtext, { fontSize: compact ? 11 : 13 }]}>
                  Just {monthlyPackage?.product.currencyCode === 'GBP' ? '£' : monthlyPackage?.product.currencyCode === 'EUR' ? '€' : '$'}{monthlyWeeklyCost}/week · Cancel anytime
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* CTA Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              onPress={handlePurchase}
              style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <Text style={[styles.ctaText, { fontSize: compact ? 16 : 18 }]}>Start 3-Day Free Trial</Text>
              )}
            </Pressable>
          </Animated.View>

          <Text style={[styles.trialNote, { fontSize: compact ? 12 : 13 }]}>
            Try free for 3 days · Cancel anytime
          </Text>

          {/* Footer Links */}
          <View style={styles.footer}>
            <Pressable onPress={restorePurchases} disabled={purchasing}>
              <Text style={[styles.footerLink, purchasing && { opacity: 0.5 }]}>Restore</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Pressable onPress={() => open("https://crushbooze.com/terms-of-service/")}>
              <Text style={styles.footerLink}>Terms</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Pressable onPress={() => open("https://crushbooze.com/privacy-policy/")}>
              <Text style={styles.footerLink}>Privacy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.select({ ios: 16, android: 24 }),
    paddingBottom: Platform.select({ ios: 20, android: 24 }),
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: GRAY,
  },
  errorText: {
    fontSize: 16,
    color: GRAY,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: NAVY,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headline: {
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 32,
  },

  // Spend card
  spendCard: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  spendText: {
    color: NAVY,
    fontWeight: '500',
    textAlign: 'center',
  },
  spendHighlight: {
    fontWeight: '800',
  },

  // Testimonial
  testimonialSection: {
    marginBottom: 12,
    alignItems: 'center',
  },
  testimonialCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
  },
  testimonialQuote: {
    color: '#1A1A2E',
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  testimonialAuthor: {
    color: GRAY,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  testimonialDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: NAVY,
  },

  // Benefits
  benefitsSection: {
    marginBottom: 12,
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    color: '#1A1A2E',
    flex: 1,
  },

  // Plans
  plansSection: {
    gap: 8,
  },
  planCard: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: WHITE,
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: NAVY,
    backgroundColor: 'rgba(3, 4, 94, 0.03)',
  },
  planBadge: {
    backgroundColor: NAVY,
    paddingVertical: 4,
    alignItems: 'center',
  },
  planBadgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  planRadio: {
    marginRight: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: NAVY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NAVY,
  },
  planDetails: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  saveBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saveBadgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  planPrice: {
    color: '#1A1A2E',
    marginTop: 1,
  },
  planSavings: {
    color: NAVY,
    fontWeight: '600',
    marginTop: 2,
  },
  planSubtext: {
    color: GRAY,
    marginTop: 2,
  },

  // Bottom
  bottomSection: {
    marginTop: 16,
  },
  ctaButton: {
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: WHITE,
    fontWeight: '700',
  },
  trialNote: {
    color: GRAY,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 13,
    color: GRAY,
  },
  footerDot: {
    color: GRAY,
  },
});
