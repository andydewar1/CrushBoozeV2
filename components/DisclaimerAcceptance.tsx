import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  SafeAreaView 
} from 'react-native';
import { AlertTriangle, Heart, CheckCircle2 } from 'lucide-react-native';

interface DisclaimerAcceptanceProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function DisclaimerAcceptance({ onAccept, onDecline }: DisclaimerAcceptanceProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptanceToggle = () => {
    setHasReadDisclaimer(!hasReadDisclaimer);
  };

  const canProceed = hasScrolledToBottom && hasReadDisclaimer;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={24} color="#FF6B47" />
        <Text style={styles.headerTitle}>Health & Medical Disclaimer</Text>
        <Text style={styles.headerSubtitle}>Required for App Store Compliance</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.disclaimerCard}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Important Medical Notice</Text>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ READ CAREFULLY BEFORE PROCEEDING</Text>
            <Text style={styles.warningText}>
              This disclaimer is required by Apple App Store and Google Play Store policies for health-related applications.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerTitle}>🚫 NOT A MEDICAL DEVICE</Text>
            <Text style={styles.disclaimerText}>
              CrushNic is <Text style={styles.bold}>NOT a medical device</Text> and is <Text style={styles.bold}>NOT intended for medical use</Text>. 
              This app does not provide medical advice, diagnosis, or treatment of any kind.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerTitle}>🏃‍♂️ GENERAL FITNESS & WELLNESS ONLY</Text>
            <Text style={styles.disclaimerText}>
              This app is designed for <Text style={styles.bold}>general fitness and wellness purposes only</Text> to help you track 
              your smoking cessation journey and provide motivational support.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerTitle}>👨‍⚕️ CONSULT HEALTHCARE PROFESSIONALS</Text>
            <Text style={styles.disclaimerText}>
              <Text style={styles.bold}>ALWAYS consult with qualified healthcare professionals</Text> before starting any smoking 
              cessation program, especially if you have medical conditions, are pregnant, breastfeeding, or experience withdrawal symptoms.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerTitle}>🏥 NO MEDICAL SUPERVISION</Text>
            <Text style={styles.disclaimerText}>
              This app does not replace professional medical supervision, counseling, or approved smoking cessation treatments 
              such as nicotine replacement therapy, prescription medications, or behavioral therapy programs.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerTitle}>📊 ESTIMATES & CALCULATIONS ONLY</Text>
            <Text style={styles.disclaimerText}>
              Health recovery timelines, savings calculations, and progress indicators are estimates based on general research 
              and population averages. <Text style={styles.bold}>Individual results may vary significantly</Text> and should not be 
              considered medical predictions or guarantees.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerTitle}>🚨 EMERGENCY SITUATIONS</Text>
            <Text style={styles.disclaimerText}>
              If you experience severe withdrawal symptoms, mental health crises, suicidal thoughts, or medical emergencies, 
              <Text style={styles.bold}> seek immediate professional medical attention</Text>. Do not rely on this app for emergency situations.
            </Text>
          </View>

          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimerTitle}>📱 APP STORE COMPLIANCE</Text>
            <Text style={styles.disclaimerText}>
              This disclaimer complies with Apple App Store and Google Play Store health app policies. By using this app, 
              you acknowledge these requirements and limitations.
            </Text>
          </View>

          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>🆘 Emergency Resources</Text>
            <Text style={styles.emergencyText}>
              • Emergency Services: Call 911 (US) or your local emergency number{'\n'}
              • Crisis Text Line: Text HOME to 741741{'\n'}
              • National Suicide Prevention Lifeline: 988{'\n'}
              • Poison Control: 1-800-222-1222
            </Text>
          </View>

          <View style={styles.finalNotice}>
            <Text style={styles.finalNoticeText}>
              By proceeding, you acknowledge that you have read, understood, and agree to this medical disclaimer. 
              You understand that this app is for educational and motivational purposes only. You agree to consult 
              healthcare professionals for medical advice regarding smoking cessation and will use this app at your own discretion.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!hasScrolledToBottom && (
          <Text style={styles.scrollPrompt}>
            📜 Please scroll down to read the complete disclaimer
          </Text>
        )}
        
        {hasScrolledToBottom && (
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={handleAcceptanceToggle}
            accessible={true}
            accessibilityLabel="Acknowledge disclaimer checkbox"
          >
            <View style={[styles.checkbox, hasReadDisclaimer && styles.checkboxChecked]}>
              {hasReadDisclaimer && <CheckCircle2 size={20} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxText}>
              I have read, understood, and agree to the medical disclaimer above
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.declineButton} 
            onPress={onDecline}
            accessible={true}
            accessibilityLabel="Decline and exit app"
          >
            <Text style={styles.declineButtonText}>Decline & Exit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.acceptButton, !canProceed && styles.acceptButtonDisabled]} 
            onPress={onAccept}
            disabled={!canProceed}
            accessible={true}
            accessibilityLabel="Accept disclaimer and continue"
          >
            <Text style={[styles.acceptButtonText, !canProceed && styles.acceptButtonTextDisabled]}>
              Accept & Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35998d',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  disclaimerCard: {
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFE69C',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  disclaimerSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bold: {
    fontWeight: '600',
    color: '#333333',
  },
  emergencyInfo: {
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#721C24',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  emergencyText: {
    fontSize: 14,
    color: '#721C24',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  finalNotice: {
    backgroundColor: '#D1ECF1',
    borderColor: '#BDE2E8',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  finalNoticeText: {
    fontSize: 14,
    color: '#0C5460',
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollPrompt: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  acceptButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35998d',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  acceptButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
}); 