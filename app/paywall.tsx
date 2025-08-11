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

type Plan = "annual" | "monthly";

const BRAND = "#35998D"; // Exact teal from screenshot
const WHITE = "#FFFFFF";
const WHITE_90 = "rgba(255,255,255,0.9)";
const WHITE_70 = "rgba(255,255,255,0.7)";
const WHITE_55 = "rgba(255,255,255,0.55)";
const BORDER = "rgba(255,255,255,0.3)";

export default function PaywallScreen() {
  const [plan, setPlan] = useState<Plan>("annual");
  const { packages, loading, purchasing, error, purchasePackage, restorePurchases, getPackageByType } = usePaywall();
  const router = useRouter();

  const { height } = Dimensions.get("window");
  const compact = height < 740;

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  // Get packages
  const annualPackage = getPackageByType('ANNUAL');
  const monthlyPackage = getPackageByType('MONTHLY');

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
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.benefitText, { textAlign: 'center', marginBottom: 20 }]}>
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
            style={[styles.headline, { fontSize: compact ? 28 : 32, lineHeight: compact ? 32 : 36, marginBottom: compact ? 20 : 24 }]}
          >
            Vaping doesn't define{"\n"}you. Crush it for good.
          </Text>

          {/* Benefits */}
          <View style={{ marginBottom: compact ? 20 : 24 }}>
            <View style={styles.benefitRow}>
              <Text style={[styles.tick, { fontSize: compact ? 16 : 18 }]}>✓</Text>
              <Text style={[styles.benefitText, { fontSize: compact ? 14 : 16 }]}>
                Track days, cravings & money saved
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={[styles.tick, { fontSize: compact ? 16 : 18 }]}>✓</Text>
              <Text style={[styles.benefitText, { fontSize: compact ? 14 : 16 }]}>
                SOS breathing + relapse-proof reminders
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={[styles.tick, { fontSize: compact ? 16 : 18 }]}>✓</Text>
              <Text style={[styles.benefitText, { fontSize: compact ? 14 : 16 }]}>
                Health milestones, achievement badges & custom goals
              </Text>
            </View>
          </View>

          {/* Testimonial */}
          <View style={[styles.testimonialCard, { marginBottom: compact ? 20 : 24 }]}>
            <Text style={[styles.testimonialText, { fontSize: compact ? 13 : 14 }]}>
              "Whenever I wanted to cave, I opened the app{"\n"}and saw my savings and health progress. It{"\n"}kept me focused. 6 weeks quit, $250 saved."
            </Text>
            <Text style={[styles.testimonialMeta, { fontSize: compact ? 11 : 12 }]}>
              – Rafel, 20, Denver, CO
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
              <Text style={[styles.planTitle, { fontSize: compact ? 18 : 20 }]}>Annual -</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>50% OFF</Text>
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
                {monthlyPackage?.product.priceString || '£4.99'}/mo · Less than a vape!
              </Text>
              <Text style={[styles.planBottomLine, { fontSize: compact ? 14 : 15 }]}>
                3-day free trial, cancel anytime.
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
                Start Your Quit Journey Today
              </Text>
            )}
          </Pressable>
          <Text style={[styles.ctaSub, { marginBottom: compact ? 20 : 24 }]}>3 days free · Cancel anytime</Text>

          {/* Legal */}
          <View style={styles.footerLinks}>
            <Pressable onPress={() => open("https://crushnic.com/privacy-policy/")}>
              <Text style={styles.link}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.dot}>·</Text>
            <Pressable onPress={() => open("https://crushnic.com/terms-of-service/")}>
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

  // Benefits
  benefitRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  tick: { color: WHITE, lineHeight: 22, fontWeight: "bold" },
  benefitText: { color: WHITE, lineHeight: 22, flexShrink: 1, fontWeight: "600" },
  bold: { fontWeight: "700", color: WHITE },

  // Testimonial
  testimonialCard: {
    backgroundColor: "rgba(0,0,0,0.2)",
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
    borderColor: WHITE,
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
    backgroundColor: WHITE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: { color: BRAND, fontWeight: "800", fontSize: 13 },

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
    backgroundColor: WHITE,
  },

  // CTA
  cta: {
    backgroundColor: WHITE,
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
  link: { color: WHITE, textDecorationLine: "underline" },
  dot: { color: WHITE_70, fontSize: 16, marginHorizontal: 2 },

  restore: { color: WHITE_55, fontSize: 15, textAlign: "center" },
});