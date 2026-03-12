import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';
import DateTimePicker from '@react-native-community/datetimepicker';

const TOTAL_STEPS = 23;

export default function QuitDateScreen() {
  const { data, updateData } = useOnboarding();
  const [date, setDate] = useState(data.quitDate || new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handleContinue = () => {
    updateData({ quitDate: date });
    router.push('/onboarding/preview-1');
  };

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  return (
    <OnboardingScreen
      currentStep={16}
      totalSteps={TOTAL_STEPS}
      title={`This is the moment it gets real, ${data.name}.`}
      subtitle="When do you want to start your alcohol-free journey?"
      onContinue={handleContinue}
      canContinue={true}
    >
      <View style={styles.container}>
        {Platform.OS === 'android' && (
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            {isToday(date) && <Text style={styles.todayBadge}>Today</Text>}
          </TouchableOpacity>
        )}

        {showPicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              minimumDate={new Date()}
              style={styles.picker}
            />
          </View>
        )}

        <View style={styles.quickOptions}>
          <TouchableOpacity 
            style={[styles.quickOption, isToday(date) && styles.quickOptionActive]}
            onPress={() => setDate(new Date())}
          >
            <Text style={[styles.quickOptionText, isToday(date) && styles.quickOptionTextActive]}>
              🚀 Start Today
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickOption}
            onPress={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setDate(tomorrow);
            }}
          >
            <Text style={styles.quickOptionText}>📅 Tomorrow</Text>
          </TouchableOpacity>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  todayBadge: {
    backgroundColor: '#03045e',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 200,
  },
  quickOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickOption: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickOptionActive: {
    borderColor: '#03045e',
    backgroundColor: '#FFFFFF',
  },
  quickOptionText: {
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  quickOptionTextActive: {
    fontWeight: '600',
    color: '#03045e',
  },
});
