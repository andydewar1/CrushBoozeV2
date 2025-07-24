import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { CravingLog } from '@/hooks/useCravingLogs';

interface LogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (log: Omit<CravingLog, 'id'>) => Promise<void>;
  onUpdate?: (logId: string, updates: Partial<Omit<CravingLog, 'id'>>) => Promise<void>;
  editingLog?: CravingLog | null;
}

export default function LogModal({ visible, onClose, onSave, onUpdate, editingLog }: LogModalProps) {
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [copingStrategy, setCopingStrategy] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingLog;

  useEffect(() => {
    if (editingLog) {
      setIntensity(editingLog.intensity);
      setTrigger(editingLog.trigger);
      setCopingStrategy(editingLog.coping_strategy);
      setNotes(editingLog.notes || '');
    } else if (visible) {
      // Reset form for new log
      setIntensity(5);
      setTrigger('');
      setCopingStrategy('');
      setNotes('');
    }
  }, [editingLog, visible]);

  const getEmojiForIntensity = (intensity: number) => {
    switch (intensity) {
      case 1: return '😊';  // Happy
      case 2: return '🙂';  // Slightly happy
      case 3: return '😐';  // Neutral/middle
      case 4: return '😕';  // Slightly concerned
      case 5: return '😟';  // Slightly annoyed
      case 6: return '😠';  // Annoyed
      case 7: return '😡';  // Angry
      case 8: return '🤬';  // Very angry
      case 9: return '😤';  // Furious
      case 10: return '🔥'; // Overwhelming
      default: return '😐';
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return '#35998d';    // Green for low
    if (intensity <= 6) return '#FF9500';    // Orange for medium
    return '#FF6B47';                        // Red for high
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 3) return 'Mild';
    if (intensity <= 6) return 'Moderate';
    if (intensity <= 8) return 'Strong';
    return 'Overwhelming';
  };

  const handleSave = async () => {
    if (!trigger.trim()) {
      Alert.alert('Validation Error', 'Please enter what triggered the craving.');
      return;
    }

    if (!copingStrategy.trim()) {
      Alert.alert('Validation Error', 'Please enter how you dealt with the craving.');
      return;
    }

    setSaving(true);
    try {
      const logData = {
        timestamp: isEditing ? editingLog!.timestamp : new Date(), // Auto-timestamp for new logs
        intensity,
        trigger: trigger.trim(),
        coping_strategy: copingStrategy.trim(),
        notes: notes.trim() || null,
      };

      if (isEditing && editingLog && onUpdate) {
        await onUpdate(editingLog.id, logData);
      } else {
        await onSave(logData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving log:', error);
      Alert.alert('Error', 'Failed to save log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Craving Log' : 'Log New Craving'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Intensity Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How intense was the craving?</Text>
            <Text style={styles.sectionSubtitle}>Tap a number from 1 (mild) to 10 (overwhelming)</Text>
            
            <View style={styles.intensityContainer}>
              <View style={styles.intensityDisplay}>
                <Text style={styles.intensityEmoji}>{getEmojiForIntensity(intensity)}</Text>
                <Text style={[styles.intensityLevel, { color: getIntensityColor(intensity) }]}>
                  Level {intensity}
                </Text>
                <Text style={styles.intensityLabel}>
                  {getIntensityLabel(intensity)}
                </Text>
              </View>
              
              <View style={styles.intensitySelector}>
                <View style={styles.intensityNumbers}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.intensityButton,
                        {
                          backgroundColor: level === intensity ? getIntensityColor(intensity) : '#F2F2F7',
                          borderColor: level === intensity ? getIntensityColor(intensity) : '#E5E5EA',
                        }
                      ]}
                      onPress={() => setIntensity(level)}
                    >
                      <Text
                        style={[
                          styles.intensityButtonText,
                          { color: level === intensity ? '#FFFFFF' : '#8E8E93' }
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.intensityLabels}>
                  <Text style={styles.intensityLabelText}>😊 Mild</Text>
                  <Text style={styles.intensityLabelText}>🔥 Overwhelming</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Trigger Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What triggered the craving?</Text>
            <Text style={styles.sectionSubtitle}>Identify what led to this feeling</Text>
            <TextInput
              style={styles.textInput}
              value={trigger}
              onChangeText={setTrigger}
              placeholder="e.g., stress at work, coffee break, social situation..."
              placeholderTextColor="#8E8E93"
              multiline
            />
          </View>

          {/* Coping Strategy Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How did you deal with it?</Text>
            <Text style={styles.sectionSubtitle}>What strategies did you use?</Text>
            <TextInput
              style={styles.textInput}
              value={copingStrategy}
              onChangeText={setCopingStrategy}
              placeholder="e.g., deep breathing, went for a walk, called a friend..."
              placeholderTextColor="#8E8E93"
              multiline
            />
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional notes</Text>
            <Text style={styles.sectionSubtitle}>Any other thoughts or observations (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling now? What worked well?"
              placeholderTextColor="#8E8E93"
              multiline
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : (isEditing ? 'Update Log' : 'Save Log')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  intensityContainer: {
    alignItems: 'center',
  },
  intensityDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  intensityEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  intensityLevel: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  intensityLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  intensitySelector: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  intensityNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  intensityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  intensityButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityLabelText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    fontSize: 17,
    color: '#1C1C1E',
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#35998d',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#35998d',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
}); 