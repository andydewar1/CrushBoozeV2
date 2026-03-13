import React, { useState } from "react";
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
} from "react-native";
import { usePaywall } from "@/hooks/usePaywall";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/contexts/OnboardingContext";
import RevenueCatService from "@/services/RevenueCatService";

type Plan = "annual" | "monthly";

const BRAND = "#03045e"; // Navy
const LIGHT_BLUE = "#caf0f8";
const WHITE = "#FFFFFF";
const WHITE_90 = "rgba(255,255,255,0.9)";
const WHITE_70 = "rgba(255,255,255,0.7)";
const WHITE_55 = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.3)";

export default function PaywallScreen() {
  const [plan, setPlan] = useState<Plan>("annual");
  const { packages, loading, purchasing, error, purchasePackage, restorePurchases, getPackageByType } = usePaywall();
  const { data, ninetyDaySavings } = useOnboarding();
  const router = useRouter();

  const { height } = Dimensions.get("window");
  const compact = height < 740;

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  // Get packages
  const annualPackage = getPackageByType('ANNUAL');
  const monthlyPackage = getPackageByType('MONTHLY');

  // Get currency symbol
  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = {
      'GBP': '£', 'USD': '$', 'EUR': '€', 'CAD': 'C$', 'AUD': 'A$',
      'NZD': 'NZ$', 'CHF': 'CHF ', 'SEK': 'kr ', 'NOK': 'kr ', 'DKK': 'kr ',
      'PLN': 'zł ', 'INR': '₹', 'JPY': '¥', 'CNY': '¥', 'BRL': 'R$', 'MXN': 'MX$',
    };
    return symbols[data.currency] || '£';
  };

  // Handle purchase
  const handlePurchase = async () => {
    const selectedPackage = plan === 'annual' ? annualPackage : monthlyPackage;
    if (selectedPackage) {
      await purchasePackage(selectedPackage);
    }
  };

  const Radio = ({ selected }: { selected: boolean }) => (
    <View style={styles.radioOuter}>{selected ? <View style={styles.radioInner} /> : null}</View>
  );

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={WHITE} />
          <Text style={[styles.benefitText, { marginTop: 16, textAlign: 'center' }]}>
            Loading subscription options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={[styles.benefitText, { textAlign: 'center', marginBottom: 20, fontSize: 16 }]}>
            {error}
          </Text>
          <Pressable
            style={styles.cta}
            onPress={() => router.replace('/paywall')}
          >
            <Text style={styles.ctaText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top Section */}
        <View>
          {/* Headline */}
          <Text
            style={[styles.headline, { fontSize: compact ? 28 : 32, lineHeight: compact ? 34 : 40, marginBottom: compact ? 20 : 24 }]}
          >
            {data.name ? `${data.name}, you're` : "You're"} ready{"\n"}to take back control.
          </Text>

          {/* Personalized stat */}
          {ninetyDaySavings > 0 && (
            <View style={[styles.statCard, { marginBottom: compact ? 16 : 20 }]}>
              <Text style={styles.statLabel}>In 90 days, you'll save</Text>
              <Text style={styles.statValue}>{getCurrencySymbol()}{ninetyDaySavings.toLocaleString()}</Text>
            </View>
          )}

          {/* Benefits */}
          <View style={{ marginBottom: compact ? 16 : 20 }}>
            <View style={styles.benefitRow}>
              <Text style={[styles.tick, { fontSize: compact ? 16 : 18 }]}>✓</Text>
              <Text style={[styles.benefitText, { fontSize: compact ? 14 : 16 }]}>
                Track days, cravings & money saved
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={[styles.tick, { fontSize: compact ? 16 : 18 }]}>✓</Text>
              <Text style={[styles.benefitText, { fontSize: compact ? 14 : 16 }]}>
                SOS support when urges hit
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={[styles.tick, { fontSize: compact ? 16 : 18 }]}>✓</Text>
              <Text style={[styles.benefitText, { fontSize: compact ? 14 : 16 }]}>
                Health recovery timeline & milestones
              </Text>
            </View>
          </View>

          {/* Testimonial */}
          <View style={[styles.testimonialCard, { marginBottom: compact ? 16 : 20 }]}>
            <Text style={[styles.testimonialText, { fontSize: compact ? 13 : 14 }]}>
              "I tried to quit so many times. This app helped{"\n"}me finally stay accountable. 3 months sober{"\n"}and I've never felt better."
            </Text>
            <Text style={[styles.testimonialMeta, { fontSize: compact ? 11 : 12 }]}>
              – Sarah, 32, London, UK
            </Text>
          </View>
        </View>

        {/* Middle Section - Plans */}
        <View>
          {/* Annual plan */}
          <Pressable
            onPress={() => setPlan("annual")}
            style={[styles.planCard, plan === "annual" && styles.planCardSelected, { marginBottom: 12 }]}
          >
            <View style={styles.planHeader}>
              <Radio selected={plan === "annual"} />
              <Text style={[styles.planTitle, { fontSize: compact ? 18 : 20 }]}>Annual</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>BEST VALUE</Text>
              </View>
            </View>
            <View style={styles.planCopy}>
              <Text style={[styles.planTopLine, { fontSize: compact ? 15 : 16 }]}>
                {annualPackage?.product.priceString || '£29.99'}/year · Most popular
              </Text>
              <Text style={[styles.planBottomLine, { fontSize: compact ? 14 : 15 }]}>
                3-day free trial, cancel anytime
              </Text>
            </View>
          </Pressable>

          {/* Monthly plan */}
          <Pressable
            onPress={() => setPlan("monthly")}
            style={[styles.planCard, plan === "monthly" && styles.planCardSelected]}
          >
            <View style={styles.planHeader}>
              <Radio selected={plan === "monthly"} />
              <Text style={[styles.planTitle, { fontSize: compact ? 18 : 20 }]}>Monthly</Text>
            </View>
            <View style={styles.planCopy}>
              <Text style={[styles.planTopLine, { fontSize: compact ? 15 : 16 }]}>
                {monthlyPackage?.product.priceString || '£9.99'}/mo · Less than a night out!
              </Text>
              <Text style={[styles.planBottomLine, { fontSize: compact ? 14 : 15 }]}>
                3-day free trial, cancel anytime
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Bottom Section */}
        <View>
          {/* CTA */}
          <Pressable
            onPress={handlePurchase}
            style={[styles.cta, purchasing && styles.ctaDisabled]}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={BRAND} />
            ) : (
              <Text style={[styles.ctaText, { fontSize: compact ? 18 : 20 }]}>
                Start My Free Trial
              </Text>
            )}
          </Pressable>
          <Text style={[styles.ctaSub, { marginBottom: compact ? 16 : 20 }]}>3 days free · Cancel anytime</Text>

          {/* Legal */}
          <View style={styles.footerLinks}>
            <Pressable onPress={() => open("https://crushbooze.com/privacy-policy/")}>
              <Text style={styles.link}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.dot}>·</Text>
            <Pressable onPress={() => open("https://crushbooze.com/terms-of-service/")}>
              <Text style={styles.link}>Terms of Use</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={restorePurchases}
            style={{ alignSelf: "center", marginTop: compact ? 8 : 12 }}
            disabled={purchasing}
          >
            <Text style={[styles.restore, purchasing && { opacity: 0.5 }]}>Restore purchases</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },
  container: {
    flex: 1,
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 12, android: 20 }),
    paddingBottom: 30,
    justifyContent: "space-between",
  },

  // Headline
  headline: {
    color: WHITE,
    fontWeight: "800",
  },

  // Stat card
  statCard: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    color: BRAND,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    color: BRAND,
    fontSize: 32,
    fontWeight: '800',
  },

  // Benefits
  benefitRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tick: { color: LIGHT_BLUE, lineHeight: 22, fontWeight: "bold" },
  benefitText: { color: WHITE, lineHeight: 22, flexShrink: 1, fontWeight: "600" },

  // Testimonial
  testimonialCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  testimonialText: {
    color: WHITE_90,
    lineHeight: 18,
  },
  testimonialMeta: {
    color: WHITE_70,
    marginTop: 6,
  },

  // Plans
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  planCardSelected: {
    borderColor: LIGHT_BLUE,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  planTitle: { color: WHITE, fontWeight: "800" },
  planCopy: { marginLeft: 36 },
  planTopLine: { color: WHITE, fontWeight: "600" },
  planBottomLine: { color: WHITE_70, marginTop: 1 },

  badge: {
    backgroundColor: LIGHT_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: { color: BRAND, fontWeight: "800", fontSize: 12 },

  // Radio
  radioOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: LIGHT_BLUE,
  },

  // CTA
  cta: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: BRAND,
    fontWeight: "900",
  },
  ctaSub: {
    color: WHITE_90,
    textAlign: "center",
    fontSize: 15,
  },

  // Legal
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  link: { color: WHITE, textDecorationLine: "underline", fontSize: 13 },
  dot: { color: WHITE_70, fontSize: 16, marginHorizontal: 2 },

  restore: { color: WHITE_55, fontSize: 14, textAlign: "center" },
});
