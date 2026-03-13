import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Goal, CreateGoal, UpdateGoal } from '@/hooks/useGoals';

interface AddEditGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: CreateGoal | { id: string; updates: UpdateGoal }) => Promise<void>;
  goal?: Goal | null;
  currency: string;
}

export default function AddEditGoalModal({
  visible,
  onClose,
  onSave,
  goal,
  currency,
}: AddEditGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!goal;

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
      setDescription(goal.description || '');
    } else {
      setName('');
      setTargetAmount('');
      setDescription('');
    }
  }, [goal, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Goal name is required');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    try {
      setLoading(true);

      if (isEditing && goal) {
        await onSave({
          id: goal.id,
          updates: {
            name: name.trim(),
            target_amount: amount,
            description: description.trim() || undefined,
          },
        });
      } else {
        await onSave({
          name: name.trim(),
          target_amount: amount,
          description: description.trim() || undefined,
        });
      }

      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AUD': return 'A$';
      case 'CAD': return 'C$';
      default: return '$';
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
            {isEditing ? 'Edit Goal' : 'Add New Goal'}
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's your goal?</Text>
            <Text style={styles.sectionSubtitle}>Give your financial goal a clear name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Dream vacation, New laptop, Emergency fund..."
              placeholderTextColor="#8E8E93"
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How much will it cost?</Text>
            <Text style={styles.sectionSubtitle}>Enter the target amount you need to save</Text>
            <View style={styles.textInput}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>
                  {getCurrencySymbol(currency)}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0.00"
                  placeholderTextColor="#8E8E93"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional notes</Text>
            <Text style={styles.sectionSubtitle}>Any other thoughts or details (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Why is this goal important to you? What will achieving it mean?"
              placeholderTextColor="#8E8E93"
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : isEditing ? 'Update Goal' : 'Add Goal'}
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
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#03045e',
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 17,
    color: '#1C1C1E',
    padding: 0,
    minHeight: 0,
  },
  saveButton: {
    backgroundColor: '#03045e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#03045e',
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