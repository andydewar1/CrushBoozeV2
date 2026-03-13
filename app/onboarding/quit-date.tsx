import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { router } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingScreen from '@/components/OnboardingScreenNew';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_STEPS = 25;

export default function QuitDateScreen() {
  const { data, updateData } = useOnboarding();
  const [date, setDate] = useState(data.quitDate || new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  const handleContinue = () => {
    updateData({ quitDate: date });
    router.push('/onboarding/previews');
  };

  const onPickerChange = (event: any, selectedValue?: Date) => {
    if (Platform.OS === 'android') {
      setPickerMode(null);
    }
    if (selectedValue) {
      if (pickerMode === 'date') {
        const newDate = new Date(date);
        newDate.setFullYear(selectedValue.getFullYear());
        newDate.setMonth(selectedValue.getMonth());
        newDate.setDate(selectedValue.getDate());
        setDate(newDate);
      } else if (pickerMode === 'time') {
        const newDate = new Date(date);
        newDate.setHours(selectedValue.getHours());
        newDate.setMinutes(selectedValue.getMinutes());
        setDate(newDate);
      }
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const closePicker = () => setPickerMode(null);

  return (
    <OnboardingScreen
      currentStep={18}
      totalSteps={TOTAL_STEPS}
      title={`When do you want to start, ${data.name}?`}
      subtitle="Pick your quit date and time."
      onContinue={handleContinue}
      canContinue={true}
    >
      <View style={styles.container}>
        {/* Date and Time Cards */}
        <View style={styles.cardsRow}>
          <TouchableOpacity 
            style={styles.card}
            onPress={() => setPickerMode('date')}
          >
            <Ionicons name="calendar-outline" size={24} color="#03045e" />
            <Text style={styles.cardLabel}>Date</Text>
            <Text style={styles.cardValue}>{formatDate(date)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => setPickerMode('time')}
          >
            <Ionicons name="time-outline" size={24} color="#03045e" />
            <Text style={styles.cardLabel}>Time</Text>
            <Text style={styles.cardValue}>{formatTime(date)}</Text>
          </TouchableOpacity>
        </View>

        {/* iOS Inline Pickers */}
        {Platform.OS === 'ios' && pickerMode && (
          <Modal transparent animationType="fade">
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={closePicker}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Select {pickerMode === 'date' ? 'Date' : 'Time'}
                  </Text>
                  <TouchableOpacity onPress={closePicker}>
                    <Text style={styles.doneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={date}
                    mode={pickerMode}
                    display="spinner"
                    onChange={onPickerChange}
                    style={styles.picker}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Android Pickers */}
        {Platform.OS === 'android' && pickerMode && (
          <DateTimePicker
            value={date}
            mode={pickerMode}
            display="default"
            onChange={onPickerChange}
          />
        )}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#03045e',
  },
  pickerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  picker: {
    height: 220,
    width: '100%',
  },
});
