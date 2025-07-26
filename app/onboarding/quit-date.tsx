import { useState } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function QuitDateScreen() {
  const { data, updateData } = useOnboarding();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(data.quitDate || new Date());

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      const newDate = new Date(date);
      // Keep the time from the existing selectedDate
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setSelectedDate(newDate);
      updateData({ quitDate: newDate });
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      setSelectedDate(newDate);
      updateData({ quitDate: newDate });
    }
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  const toggleHasQuit = (value: boolean) => {
    updateData({ hasQuit: value });
    
    // Only update the date constraints, don't change the selected date
    // The user should keep their chosen date regardless of the toggle
    if (!value) {
      // If planning to quit in future, ensure date isn't in the past
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (selectedDate < tomorrow) {
        setSelectedDate(tomorrow);
        updateData({ quitDate: tomorrow });
      }
    }
    // If already quit (value = true), keep whatever date they selected
  };

  const formatDateTime = (date: Date) => {
    const formattedDate = format(date, 'MMMM d, yyyy');
    const formattedTime = format(date, 'h:mm a').replace(' ', ''); // Remove space before AM/PM
    return { formattedDate, formattedTime };
  };

  return (
    <OnboardingScreen
      title="Set your quit date"
      subtitle="When would you like to start your journey?"
      currentStep={1}
      totalSteps={7}
      nextScreen="/onboarding/goals"
      canProgress={selectedDate !== null}
    >
      <View style={styles.container}>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>I've already quit</Text>
          <Switch
            value={data.hasQuit}
            onValueChange={toggleHasQuit}
            trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.3)' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="rgba(255, 255, 255, 0.3)"
          />
        </View>

        <View style={styles.dateContainer}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="inline"
            onChange={handleDateChange}
            maximumDate={data.hasQuit ? new Date() : undefined}
            minimumDate={!data.hasQuit ? new Date() : undefined}
            textColor="#FFFFFF"
            accentColor="#FFFFFF"
            themeVariant="dark"
          />
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.label}>What time?</Text>
          {Platform.OS === 'ios' ? (
            <View style={styles.timePickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor="#FFFFFF"
                themeVariant="dark"
              />
            </View>
          ) : (
            <>
              <Text 
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                {format(selectedDate, 'h:mm a')}
              </Text>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  is24Hour={false}
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>
            {data.hasQuit ? 'Your journey began' : 'Your journey begins'}
          </Text>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>
              {formatDateTime(selectedDate).formattedDate}
            </Text>
            <Text style={styles.timeText}>
              {formatDateTime(selectedDate).formattedTime}
            </Text>
          </View>
          <Text style={styles.motivationalText}>
            {data.hasQuit 
              ? "Every moment since then is a step towards a healthier you"
              : "This date marks the beginning of your journey to freedom"
            }
          </Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  dateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
  },
  timeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  timePickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
  },
  timeButton: {
    fontSize: 17,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    textAlign: 'center',
    overflow: 'hidden',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    marginTop: 'auto',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  dateTimeContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  timeText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  motivationalText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontStyle: 'italic',
  },
}); 