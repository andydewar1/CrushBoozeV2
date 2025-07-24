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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

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
  const [editingChangeEmail, setEditingChangeEmail] = useState(false);
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
  const [tempNewEmail, setTempNewEmail] = useState('');
  const [tempEmailPassword, setTempEmailPassword] = useState('');
  
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

  const handleSaveEmail = async () => {
    if (!tempNewEmail || !tempEmailPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempNewEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      // First, verify the current password by attempting to sign in
      const currentEmail = session?.user?.email;
      if (!currentEmail) {
        Alert.alert('Error', 'Could not verify current user.');
        return;
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: tempEmailPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Incorrect password. Please try again.');
        return;
      }

      // Update email
      const { error } = await supabase.auth.updateUser({
        email: tempNewEmail
      });

      if (error) throw error;
      
      setEditingChangeEmail(false);
      setTempNewEmail('');
      setTempEmailPassword('');
      
      Alert.alert(
        'Email Update Requested', 
        'Please check both your old and new email addresses for confirmation links. You\'ll need to confirm the change from both emails.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error updating email:', error);
      Alert.alert('Error', 'Failed to update email. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including:\n\n• Your quit journey progress\n• All goals and achievements\n• Craving logs and statistics\n• Account settings and preferences',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will PERMANENTLY delete your account and all data. Type DELETE to confirm.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'I understand, delete my account',
                  style: 'destructive',
                  onPress: performAccountDeletion
                }
              ]
            );
          }
        }
      ]
    );
  };

  const performAccountDeletion = async () => {
    setSaving(true);
    try {
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'Unable to identify user account.');
        return;
      }

      // Delete user data from all tables
      const deletePromises = [
        supabase.from('profiles').delete().eq('id', userId),
        supabase.from('goals').delete().eq('user_id', userId),
        supabase.from('financial_goals').delete().eq('user_id', userId),
        supabase.from('craving_logs').delete().eq('user_id', userId),
      ];

      await Promise.all(deletePromises);

      // Delete the auth user (this will sign them out)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        // If admin deletion fails, try user deletion
        const { error: userError } = await supabase.auth.updateUser({
          email: `deleted-${Date.now()}@deleted.com`
        });
        if (userError) throw userError;
      }

      // Sign out the user
      await signOut();

      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted. Thank you for using CrushNic.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );

    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Deletion Error', 
        'There was an error deleting your account. Please contact support for assistance.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleContactSupport = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://crushnic.com/support/', {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#35998d',
      });
    } catch (error) {
      console.error('Error opening support page:', error);
      Alert.alert('Error', 'Unable to open support page. Please visit crushnic.com/support directly.');
    }
  };

  const handleHelpFAQ = () => {
    setShowHelpFAQ(true);
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacyPolicy(true);
  };

  const handleTermsOfService = () => {
    setShowTermsOfService(true);
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
      const [profileResult, financialGoalsResult, goalsResult, logsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userData.user.id).single(),
        supabase.from('financial_goals').select('*').eq('user_id', userData.user.id),
        supabase.from('goals').select('*').eq('user_id', userData.user.id),
        supabase.from('craving_logs').select('*').eq('user_id', userData.user.id)
      ]);

      const exportData = {
        user: {
          email: userData.user.email,
          created_at: userData.user.created_at,
        },
        profile: profileResult.data,
        financial_goals: financialGoalsResult.data || [],
        goals: goalsResult.data || [],
        craving_logs: logsResult.data || [],
        exported_at: new Date().toISOString(),
        app_version: '1.0.0',
        export_format: 'CrushNic_Data_Export_v1'
      };

      // Create formatted JSON string
      const dataString = JSON.stringify(exportData, null, 2);
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const filename = `CrushNic_Data_Export_${timestamp}.json`;
      
      // Save to file system
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, dataString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available and share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your CrushNic Data',
          UTI: 'public.json'
        });
      } else {
        // Fallback - show file location
        Alert.alert(
          'Export Complete',
          `Your data has been exported successfully!\n\nFile saved to: ${filename}\n\nData includes:\n• Profile: ${profileResult.data ? 'Yes' : 'No'}\n• Financial Goals: ${financialGoalsResult.data?.length || 0}\n• Personal Goals: ${goalsResult.data?.length || 0}\n• Craving Logs: ${logsResult.data?.length || 0}`,
          [{ text: 'OK' }]
        );
      }

      console.log('Data exported to:', fileUri);

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
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
            onPress={() => setEditingChangeEmail(true)}
          >
            <Text style={styles.settingLabel}>Change Email</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

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

          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
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

          <TouchableOpacity style={styles.settingItem} onPress={handleHelpFAQ}>
            <Text style={styles.settingLabel}>Help & FAQ</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleContactSupport}>
            <Text style={styles.settingLabel}>Contact Support</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <ChevronRight size={16} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
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

      {/* Change Email Modal */}
      <Modal
        visible={editingChangeEmail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingChangeEmail(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Email</Text>
                <TouchableOpacity onPress={() => setEditingChangeEmail(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.currentEmailInfo}>
                <Text style={styles.currentEmailLabel}>Current Email:</Text>
                <Text style={styles.currentEmailText}>{session?.user?.email}</Text>
              </View>

              <TextInput
                style={styles.passwordInput}
                value={tempNewEmail}
                onChangeText={setTempNewEmail}
                placeholder="New email address"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.passwordInput}
                value={tempEmailPassword}
                onChangeText={setTempEmailPassword}
                placeholder="Current password (for verification)"
                placeholderTextColor="#8E8E93"
                secureTextEntry
              />

              <Text style={styles.emailChangeNotice}>
                You'll receive confirmation emails at both your current and new email addresses. You must confirm from both to complete the change.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setEditingChangeEmail(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={handleSaveEmail}
                  disabled={saving || !tempNewEmail || !tempEmailPassword}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{saving ? 'Updating...' : 'Update Email'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Help & FAQ Modal */}
      <Modal
        visible={showHelpFAQ}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelpFAQ(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Help & FAQ</Text>
                <TouchableOpacity onPress={() => setShowHelpFAQ(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.faqContainer}>
                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>How do I track my quit progress?</Text>
                  <Text style={styles.faqAnswer}>
                    Your quit progress is automatically tracked from your quit date. You can see your days clean, money saved, and health improvements on the home screen.
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>How is my money saved calculated?</Text>
                  <Text style={styles.faqAnswer}>
                    Money saved is calculated based on your daily vaping costs and the number of days since your quit date. Update your daily costs in settings if needed.
                  </Text>
                </View>

                                 <View style={styles.faqItem}>
                   <Text style={styles.faqQuestion}>Can I change my quit date?</Text>
                   <Text style={styles.faqAnswer}>
                     Yes! Go to Settings {`>`} Quit Journey {`>`} Edit quit date. This will recalculate all your progress and statistics.
                   </Text>
                 </View>

                 <View style={styles.faqItem}>
                   <Text style={styles.faqQuestion}>How do goals work?</Text>
                   <Text style={styles.faqAnswer}>
                     Set financial goals to stay motivated. The app tracks your progress toward each goal based on money saved from not vaping.
                   </Text>
                 </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>What are craving logs?</Text>
                  <Text style={styles.faqAnswer}>
                    Log your cravings to track triggers, intensity, and coping strategies. This helps identify patterns and improve your quit strategy.
                  </Text>
                </View>

                                 <View style={styles.faqItem}>
                   <Text style={styles.faqQuestion}>How do I export my data?</Text>
                   <Text style={styles.faqAnswer}>
                     Go to Settings {`>`} Account Management {`>`} Export My Data. This creates a JSON file with all your progress, goals, and logs.
                   </Text>
                 </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Is my data secure?</Text>
                  <Text style={styles.faqAnswer}>
                    Yes! Your data is encrypted and stored securely. We never share personal information with third parties. See our Privacy Policy for details.
                  </Text>
                </View>

                                 <View style={styles.faqItem}>
                   <Text style={styles.faqQuestion}>How do I delete my account?</Text>
                   <Text style={styles.faqAnswer}>
                     Go to Settings {`>`} Account Management {`>`} Delete Account. This permanently removes all your data and cannot be undone.
                   </Text>
                 </View>

                 <View style={styles.faqItem}>
                   <Text style={styles.faqQuestion}>Need more help?</Text>
                   <Text style={styles.faqAnswer}>
                     Contact our support team through Settings {`>`} Support & Info {`>`} Contact Support, or visit crushnic.com/support.
                   </Text>
                 </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => setShowHelpFAQ(false)}
              >
                <Text style={styles.saveButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Privacy Policy</Text>
                <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.legalDocContainer}>
                <Text style={styles.legalDocText}>
                  Last updated: July 24, 2025{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Introduction{'\n\n'}</Text>
                  Welcome to CrushNic ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we handle your information when you use our CrushNic mobile application (the "App") and website at crushnic.com.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Information We Collect{'\n\n'}</Text>
                  <Text style={styles.legalDocSubheader}>Information You Provide Directly{'\n\n'}</Text>
                  • Account information (email address, password){'\n'}
                  • Quit date and personal motivation statements{'\n'}
                  • Selected personal goals and vaping product information{'\n'}
                  • Financial goals and daily vaping costs{'\n'}
                  • Craving logs and coping strategy notes{'\n\n'}
                  
                  <Text style={styles.legalDocSubheader}>Information Collected Automatically{'\n\n'}</Text>
                  • App usage patterns and session duration{'\n'}
                  • Device information and performance metrics{'\n'}
                  • Authentication and security data{'\n\n'}
                  
                  <Text style={styles.legalDocSubheader}>Information We Do NOT Collect{'\n\n'}</Text>
                  We explicitly do not collect: location data, contacts, photos, browser history, information from other apps, social media profiles, or biometric data.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>How We Use Your Information{'\n\n'}</Text>
                  • Track your progress and calculate savings{'\n'}
                  • Provide personalized achievements and milestones{'\n'}
                  • Analyze craving patterns and provide support{'\n'}
                  • Improve app performance and user experience{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Data Security{'\n\n'}</Text>
                  Your data is encrypted and stored securely using Supabase infrastructure with industry-standard security measures including TLS 1.3 encryption, secure authentication, and regular security audits.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Your Rights{'\n\n'}</Text>
                  You have the right to access, correct, export, or delete your personal information at any time through the app settings. You can also control notification preferences and withdraw consent.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Contact Us{'\n\n'}</Text>
                  For privacy questions: privacy@crushnic.com{'\n'}
                  Support: crushnic.com/support{'\n\n'}
                  
                  CrushNic Ltd.{'\n'}
                  20-22 Wenlock Road{'\n'}
                  London, N1 7GU{'\n'}
                  United Kingdom{'\n\n'}
                  
                  This policy is effective as of July 24, 2025.
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => setShowPrivacyPolicy(false)}
              >
                <Text style={styles.saveButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsOfService}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTermsOfService(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Terms of Service</Text>
                <TouchableOpacity onPress={() => setShowTermsOfService(false)}>
                  <X size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.legalDocContainer}>
                <Text style={styles.legalDocText}>
                  Last updated: July 24, 2025{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Agreement to Terms{'\n\n'}</Text>
                  By using the CrushNic mobile application or website, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Description of Service{'\n\n'}</Text>
                  CrushNic is a digital health and wellness application designed to support individuals in quitting vaping and nicotine use. The App provides progress tracking, financial calculations, goal setting, craving support, and achievement systems.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Eligibility{'\n\n'}</Text>
                  You must be at least 18 years old to use this Service. You must provide accurate information during registration and maintain the security of your account.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Acceptable Use{'\n\n'}</Text>
                  You may use the Service to track your quit journey, set goals, and access support resources. You may not violate laws, infringe rights of others, transmit harmful content, or attempt unauthorized access.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Health Disclaimers{'\n\n'}</Text>
                  <Text style={styles.legalDocImportant}>IMPORTANT:</Text> CrushNic is not a medical device and does not provide medical advice. The App is for educational and motivational purposes only. Always consult healthcare professionals for medical decisions.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Privacy{'\n\n'}</Text>
                  Your privacy is protected according to our Privacy Policy. We implement security measures but cannot guarantee absolute security. You use the Service at your own risk regarding data security.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Termination{'\n\n'}</Text>
                  You may terminate your account at any time. We may terminate accounts for violations of these Terms. Upon termination, your data will be deleted as described in our Privacy Policy.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Limitation of Liability{'\n\n'}</Text>
                  Our liability is limited to £100 or amounts paid in the past 12 months. We are not liable for indirect or consequential damages. The Service is provided "as is" without warranties.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Governing Law{'\n\n'}</Text>
                  These Terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of English courts.{'\n\n'}
                  
                  <Text style={styles.legalDocHeader}>Contact Information{'\n\n'}</Text>
                  For questions: support@crushnic.com{'\n'}
                  Legal notices: legal@crushnic.com{'\n\n'}
                  
                  CrushNic Ltd.{'\n'}
                  20-22 Wenlock Road{'\n'}
                  London, N1 7GU{'\n'}
                  United Kingdom{'\n\n'}
                  
                  Effective Date: July 24, 2025
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={() => setShowTermsOfService(false)}
              >
                <Text style={styles.saveButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
  currentEmailInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E3E6',
  },
  currentEmailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '500',
  },
  currentEmailText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  emailChangeNotice: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  faqContainer: {
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E3E6',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  legalDocContainer: {
    marginBottom: 20,
  },
  legalDocText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 22,
  },
  legalDocHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  legalDocSubheader: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  legalDocImportant: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
}); 