import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { 
  X, 
  User, 
  Calendar, 
  Cigarette,
  Crown, 
  HelpCircle, 
  Shield, 
  RefreshCw,
  LogOut,
  ChevronRight,
  Heart,
  Trash2,
  Edit3,
  Check,
  Plus,
  Minus,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMoneySaved } from '@/hooks/useMoneySaved';
import { useQuitTimer } from '@/hooks/useQuitTimer';
import { useQuitMotivation } from '@/hooks/useQuitMotivation';
import { supabase } from '@/lib/supabase';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];



const PERSONAL_GOALS = [
  { id: 'money', title: 'Save Money' },
  { id: 'health', title: 'Improve Health' },
  { id: 'sleep', title: 'Sleep Better' },
  { id: 'balance', title: 'More Balance' },
  { id: 'compassion', title: 'Self-Compassion' },
  { id: 'stress', title: 'Reduce Stress' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const { data: profile, loading: profileLoading } = useUserProfile();
  const { currency } = useMoneySaved();
  const { quitDate, days } = useQuitTimer();
  const { motivation, refetch: refetchMotivation } = useQuitMotivation();

  // Edit states
  const [editingQuitDate, setEditingQuitDate] = useState(false);
  const [editingPersonalWhy, setEditingPersonalWhy] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(false);

  const [editingPersonalGoals, setEditingPersonalGoals] = useState(false);
  const [editingDailyCosts, setEditingDailyCosts] = useState(false);
  const [editingChangePassword, setEditingChangePassword] = useState(false);
  const [showHelpFAQ, setShowHelpFAQ] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  // Temp data states
  const [tempQuitDate, setTempQuitDate] = useState<Date>(quitDate || new Date());
  const [tempPersonalWhy, setTempPersonalWhy] = useState(motivation?.quitReason || '');
  const [tempCurrency, setTempCurrency] = useState(currency || '$');

  const [tempPersonalGoals, setTempPersonalGoals] = useState<string[]>(motivation?.personalGoals || []);
  const [tempDailyCost, setTempDailyCost] = useState(profile?.daily_cost?.toString() || '0');
  const [tempCurrentPassword, setTempCurrentPassword] = useState('');
  const [tempNewPassword, setTempNewPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refresh data function
  const refreshData = useCallback(async () => {
    try {
      await refetchMotivation();
      // Force re-render by updating a dummy state or use a proper data fetching solution
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [refetchMotivation]);

  // Refresh data when profile changes
  useEffect(() => {
    if (motivation) {
      setTempPersonalWhy(motivation.quitReason || '');
      // Filter out empty or invalid goals
      const validGoals = (motivation.personalGoals || []).filter(goal => goal && goal.trim() !== '');
      setTempPersonalGoals(validGoals);
    }
    if (quitDate) {
      setTempQuitDate(quitDate);
    }
    if (currency) {
      setTempCurrency(currency);
    }
    if (profile?.daily_cost) {
      setTempDailyCost(profile.daily_cost.toString());
    }
  }, [motivation, quitDate, currency, profile]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveQuitDate = async () => {
    if (!session?.user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          quit_date: tempQuitDate.toISOString(),
          has_quit: true 
        })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setEditingQuitDate(false);
      setShowDatePicker(false);
      
      // Force page refresh to show updated data
      setTimeout(() => {
        router.replace('/settings');
      }, 500);
      
      Alert.alert('Success', 'Quit date updated successfully!');
    } catch (error) {
      console.error('Error updating quit date:', error);
      Alert.alert('Error', 'Failed to update quit date. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonalWhy = async () => {
    if (!session?.user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ quit_reason: tempPersonalWhy })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setEditingPersonalWhy(false);
      
      // Force page refresh to show updated data
      setTimeout(() => {
        router.replace('/settings');
      }, 500);
      
      Alert.alert('Success', 'Personal reason updated successfully!');
    } catch (error) {
      console.error('Error updating personal why:', error);
      Alert.alert('Error', 'Failed to update personal reason. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrency = async () => {
    if (!session?.user?.id) return;
    
    setSaving(true);
    try {
      // Find the currency code from the symbol
      const selectedCurrency = CURRENCIES.find(c => c.symbol === tempCurrency);
      const currencyCode = selectedCurrency ? selectedCurrency.code : 'USD';
      
      const { error } = await supabase
        .from('profiles')
        .update({ currency: currencyCode })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setEditingCurrency(false);
      
      // Force page refresh to show updated data
      setTimeout(() => {
        router.replace('/settings');
      }, 500);
      
      Alert.alert('Success', 'Currency updated successfully!');
    } catch (error) {
      console.error('Error updating currency:', error);
      Alert.alert('Error', 'Failed to update currency. Please try again.');
    } finally {
      setSaving(false);
    }
  };





  const handleSavePersonalGoals = async () => {
    if (!session?.user?.id) return;
    
    setSaving(true);
    try {
      // Ensure we're saving only the selected goal IDs, completely replacing the array
      const { error } = await supabase
        .from('profiles')
        .update({ personal_goals: tempPersonalGoals })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setEditingPersonalGoals(false);
      
      // Force page refresh to show updated data
      setTimeout(() => {
        router.replace('/settings');
      }, 500);
      
      Alert.alert('Success', 'Personal goals updated successfully!');
    } catch (error) {
      console.error('Error updating personal goals:', error);
      Alert.alert('Error', 'Failed to update personal goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDailyCosts = async () => {
    if (!session?.user?.id) return;
    
    const cost = parseFloat(tempDailyCost) || 0;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_cost: cost })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setEditingDailyCosts(false);
      
      // Force page refresh to show updated data
      setTimeout(() => {
        router.replace('/settings');
      }, 500);
      
      Alert.alert('Success', 'Daily costs updated successfully!');
    } catch (error) {
      console.error('Error updating daily costs:', error);
      Alert.alert('Error', 'Failed to update daily costs. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!tempNewPassword || !tempConfirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (tempNewPassword !== tempConfirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (tempNewPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: tempNewPassword
      });

      if (error) throw error;
      
      setEditingChangePassword(false);
      setTempCurrentPassword('');
      setTempNewPassword('');
      setTempConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setSaving(true);
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        Alert.alert('Error', 'Failed to get user data');
        return;
      }

      // Get all user data
      const [profileResult, goalsResult, logsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userData.user.id).single(),
        supabase.from('financial_goals').select('*').eq('user_id', userData.user.id),
        supabase.from('craving_logs').select('*').eq('user_id', userData.user.id)
      ]);

      const exportData = {
        user: {
          email: userData.user.email,
          created_at: userData.user.created_at,
        },
        profile: profileResult.data,
        goals: goalsResult.data || [],
        logs: logsResult.data || [],
        exported_at: new Date().toISOString(),
      };

      // For now, show the data summary
      const dataString = JSON.stringify(exportData, null, 2);
      console.log('Exported data:', dataString);
      
      Alert.alert(
        'Data Export Complete',
        `Your data has been prepared for export.\n\nData includes:\n• Profile: ${profileResult.data ? 'Yes' : 'No'}\n• Goals: ${goalsResult.data?.length || 0}\n• Logs: ${logsResult.data?.length || 0}\n\nData logged to console for now. File export feature coming soon.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAllData = () => {
    Alert.alert(
      '⚠️ Reset All Data',
      'This will permanently delete ALL your data including progress, goals, logs, and settings. This action cannot be undone and you will need to complete onboarding again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand - Reset Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This will delete everything and cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Reset All Data',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const { data: userData } = await supabase.auth.getUser();
                      if (userData.user) {
                        await Promise.all([
                          supabase.from('financial_goals').delete().eq('user_id', userData.user.id),
                          supabase.from('craving_logs').delete().eq('user_id', userData.user.id),
                          supabase.from('profiles').delete().eq('id', userData.user.id),
                        ]);
                        
                        Alert.alert('Success', 'All data has been reset. You will now be redirected to onboarding.');
                        router.replace('/onboarding/quit-date');
                      }
                    } catch (error) {
                      console.error('Reset error:', error);
                      Alert.alert('Error', 'Failed to reset data. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrencyDisplay = () => {
    const currencyObj = CURRENCIES.find(c => c.symbol === currency);
    return currencyObj ? currencyObj.code : 'USD';
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempQuitDate(selectedDate);
    }
  };



  const togglePersonalGoal = (goalId: string) => {
    setTempPersonalGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Profile Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Profile Overview</Text>
          </View>
          
          <View style={styles.profileCard}>
            <Text style={styles.profileEmail}>{session?.user?.email || 'Loading...'}</Text>
            <Text style={styles.profileSubtext}>
              {quitDate ? `${days} days smoke-free since ${formatDate(quitDate)}` : 'Getting started on your quit journey'}
            </Text>
          </View>
        </View>

        {/* Quit Journey Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Quit Journey Details</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Update your key information</Text>

          {/* Quit Date */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Quit Date</Text>
              <Text style={styles.settingValue}>{formatDate(quitDate)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditingQuitDate(true)}
            >
              <Edit3 size={16} color="#35998d" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Personal Why</Text>
              <Text style={styles.settingValue} numberOfLines={2}>
                {motivation?.quitReason || 'Add your personal reason'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                setTempPersonalWhy(motivation?.quitReason || '');
                setEditingPersonalWhy(true);
              }}
            >
              <Edit3 size={16} color="#35998d" />
            </TouchableOpacity>
          </View>



          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Personal Goals</Text>
              <Text style={styles.settingValue} numberOfLines={2}>
                {motivation?.personalGoals?.length ? 
                  motivation.personalGoals
                    .filter(goalId => goalId && goalId.trim() !== '')
                    .map(goalId => {
                      const goalObj = PERSONAL_GOALS.find(g => g.id === goalId);
                      return goalObj ? goalObj.title : goalId;
                    })
                    .join(', ') : 
                  'Add goals'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                // Start with current valid goals
                const validGoals = (motivation?.personalGoals || []).filter(goal => goal && goal.trim() !== '');
                setTempPersonalGoals(validGoals);
                setEditingPersonalGoals(true);
              }}
            >
              <Edit3 size={16} color="#35998d" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingValue}>{getCurrencyDisplay()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditingCurrency(true)}
            >
              <Edit3 size={16} color="#35998d" />
            </TouchableOpacity>
          </View>

          {/* Daily Costs */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Daily Spending</Text>
              <Text style={styles.settingValue}>
                {currency}{profile?.daily_cost || '0'} per day
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                setTempDailyCost(profile?.daily_cost?.toString() || '0');
                setEditingDailyCosts(true);
              }}
            >
              <Edit3 size={16} color="#35998d" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Account Management</Text>
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setEditingChangePassword(true)}
          >
            <Text style={styles.settingLabel}>Change Password</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <Text style={styles.settingLabel}>Export My Data</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={[styles.settingLabel, styles.warningText]}>Delete Account</Text>
            <ChevronRight size={16} color="#FF6B47" />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={20} color="#35998d" />
            <Text style={styles.sectionTitle}>Support & Info</Text>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Help & FAQ</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Contact Support</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color="#FF6B47" />
            <Text style={[styles.sectionTitle, { color: '#FF6B47' }]}>Danger Zone</Text>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleResetAllData}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, styles.dangerText]}>Reset All Data</Text>
              <Text style={styles.dangerSubtext}>Permanently delete everything - cannot be undone</Text>
            </View>
            <ChevronRight size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Quit Date Modal */}
      <Modal
        visible={editingQuitDate}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingQuitDate(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Quit Date</Text>
                <TouchableOpacity onPress={() => setEditingQuitDate(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateSection}>
                <Text style={styles.dateLabel}>Current Quit Date</Text>
                <View style={styles.currentDateDisplay}>
                  <Calendar size={20} color="#35998d" />
                  <Text style={styles.currentDateText}>{formatDate(tempQuitDate)}</Text>
                </View>
                
                <Text style={styles.dateInstructions}>Select a new date:</Text>
                <DateTimePicker
                  value={tempQuitDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.datePicker}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditingQuitDate(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSaveQuitDate}
                  disabled={saving}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Personal Why Modal */}
      <Modal
        visible={editingPersonalWhy}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingPersonalWhy(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Personal Why</Text>
                <TouchableOpacity onPress={() => setEditingPersonalWhy(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.textInput}
                value={tempPersonalWhy}
                onChangeText={setTempPersonalWhy}
                placeholder="Write your personal reason for quitting..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditingPersonalWhy(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSavePersonalWhy}
                  disabled={saving || !tempPersonalWhy.trim()}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Currency Modal */}
      <Modal
        visible={editingCurrency}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingCurrency(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Currency</Text>
                <TouchableOpacity onPress={() => setEditingCurrency(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyOption,
                    tempCurrency === curr.symbol && styles.selectedCurrencyOption
                  ]}
                  onPress={() => setTempCurrency(curr.symbol)}
                >
                  <Text style={styles.currencyText}>{curr.symbol} - {curr.name}</Text>
                  {tempCurrency === curr.symbol && (
                    <Check size={16} color="#35998d" />
                  )}
                </TouchableOpacity>
              ))}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditingCurrency(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSaveCurrency}
                  disabled={saving}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>



      {/* Edit Personal Goals Modal */}
      <Modal
        visible={editingPersonalGoals}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingPersonalGoals(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Personal Goals</Text>
                <TouchableOpacity onPress={() => setEditingPersonalGoals(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              {PERSONAL_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalOption,
                    tempPersonalGoals.includes(goal.id) && styles.selectedGoalOption
                  ]}
                  onPress={() => togglePersonalGoal(goal.id)}
                >
                  <Text style={styles.goalText}>{goal.title}</Text>
                  {tempPersonalGoals.includes(goal.id) && (
                    <Check size={16} color="#35998d" />
                  )}
                </TouchableOpacity>
              ))}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditingPersonalGoals(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSavePersonalGoals}
                  disabled={saving || tempPersonalGoals.length === 0}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Daily Costs Modal */}
      <Modal
        visible={editingDailyCosts}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingDailyCosts(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Daily Spending</Text>
                <TouchableOpacity onPress={() => setEditingDailyCosts(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.costInputContainer}>
                <Text style={styles.costLabel}>Daily spending on vaping</Text>
                <View style={styles.costInputWrapper}>
                  <Text style={styles.currencySymbol}>{currency}</Text>
                  <TextInput
                    style={styles.costInput}
                    value={tempDailyCost}
                    onChangeText={setTempDailyCost}
                    placeholder="0.00"
                    placeholderTextColor="#8E8E93"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditingDailyCosts(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSaveDailyCosts}
                  disabled={saving}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={editingChangePassword}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingChangePassword(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setEditingChangePassword(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.passwordInput}
                value={tempNewPassword}
                onChangeText={setTempNewPassword}
                placeholder="New password"
                placeholderTextColor="#8E8E93"
                secureTextEntry
              />

              <TextInput
                style={styles.passwordInput}
                value={tempConfirmPassword}
                onChangeText={setTempConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#8E8E93"
                secureTextEntry
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditingChangePassword(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSavePassword}
                  disabled={saving || !tempNewPassword || !tempConfirmPassword}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.1)',
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingContent: {
    flex: 1,
    marginLeft: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(53, 153, 141, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerItem: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: 8,
    paddingTop: 16,
  },
  dangerText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  dangerSubtext: {
    fontSize: 12,
    color: '#FF6B47',
    marginTop: 2,
  },
  warningText: {
    color: '#FF6B47',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  currentDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  currentDateText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
    fontWeight: '500',
  },
  dateInstructions: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  datePicker: {
    height: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#35998d',
    marginLeft: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F8F9FA',
    marginBottom: 20,
    minHeight: 100,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F8F9FA',
    marginBottom: 16,
  },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedCurrencyOption: {
    backgroundColor: 'rgba(53, 153, 141, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.3)',
  },
  currencyText: {
    fontSize: 16,
    color: '#1C1C1E',
  },

  goalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedGoalOption: {
    backgroundColor: 'rgba(53, 153, 141, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(53, 153, 141, 0.3)',
  },
  goalText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  costInputContainer: {
    marginBottom: 20,
  },
  costLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 12,
    fontWeight: '500',
  },
  costInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#35998d',
    fontWeight: '600',
    marginRight: 8,
  },
  costInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#35998d',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 