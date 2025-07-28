import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Heart, AlertTriangle } from 'lucide-react-native';

interface MedicalDisclaimerProps {
  style?: any;
}

export default function MedicalDisclaimer({ style }: MedicalDisclaimerProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Heart size={18} color="#35998d" />
        <Text style={styles.title}>Health & Medical Disclaimer</Text>
      </View>
      
      <View style={styles.warningContainer}>
        <AlertTriangle size={16} color="#FF6B47" />
        <Text style={styles.warningText}>Important Medical Notice</Text>
      </View>
      
      <Text style={styles.disclaimer}>
        <Text style={styles.bold}>NOT A MEDICAL DEVICE:</Text> CrushNic is <Text style={styles.bold}>not a medical device</Text> and is <Text style={styles.bold}>not intended for medical use</Text>. This app does not provide medical advice, diagnosis, or treatment.
      </Text>
      
      <Text style={styles.disclaimer}>
        <Text style={styles.bold}>GENERAL FITNESS & WELLNESS ONLY:</Text> This app is designed for <Text style={styles.bold}>general fitness and wellness purposes only</Text> to help track your smoking cessation journey and provide motivational support.
      </Text>
      
      <Text style={styles.disclaimer}>
        <Text style={styles.bold}>CONSULT HEALTHCARE PROFESSIONALS:</Text> Before starting any smoking cessation program, <Text style={styles.bold}>always consult with qualified healthcare professionals</Text>, especially if you have medical conditions, are pregnant, or experience withdrawal symptoms.
      </Text>
      
      <Text style={styles.disclaimer}>
        <Text style={styles.bold}>NO MEDICAL SUPERVISION:</Text> This app does not replace professional medical supervision, counseling, or approved smoking cessation treatments such as nicotine replacement therapy or prescription medications.
      </Text>
      
      <Text style={styles.disclaimer}>
        <Text style={styles.bold}>ESTIMATES ONLY:</Text> Health recovery timelines, savings calculations, and progress indicators are estimates based on general research and population averages. Individual results may vary significantly and should not be considered medical predictions or guarantees.
      </Text>
      
      <Text style={styles.disclaimer}>
        <Text style={styles.bold}>EMERGENCY SITUATIONS:</Text> If you experience severe withdrawal symptoms, mental health crises, or medical emergencies, seek immediate professional medical attention. Do not rely on this app for emergency situations.
      </Text>
      
      <Text style={styles.footer}>
        By using CrushNic, you acknowledge that you have read, understood, and agree to this medical disclaimer. You understand that this app is for educational and motivational purposes only and agree to use it at your own discretion. You will consult healthcare professionals for medical advice regarding smoking cessation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B47',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  disclaimer: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
}); 