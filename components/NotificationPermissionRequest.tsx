import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Bell, BellOff, X } from 'lucide-react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_REQUESTED_KEY = 'notification-permission-requested';

export default function NotificationPermissionRequest() {
  const [showModal, setShowModal] = useState(false);
  const { requestPermissions, hasPermissions } = useNotifications();

  useEffect(() => {
    const checkShouldShowRequest = async () => {
      try {
        const hasRequested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
        
        // Show modal if we haven't requested before and don't have permissions
        if (!hasRequested && !hasPermissions) {
          setShowModal(true);
        }
      } catch (error) {
        console.log('Error checking notification permission status:', error);
      }
    };

    checkShouldShowRequest();
  }, [hasPermissions]);

  const handleRequestPermissions = async () => {
    try {
      await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
      await requestPermissions();
      setShowModal(false);
    } catch (error) {
      console.log('Error requesting notification permissions:', error);
      setShowModal(false);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
      setShowModal(false);
    } catch (error) {
      console.log('Error setting permission requested flag:', error);
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Bell size={32} color="#35998d" />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleSkip}>
              <X size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Stay Motivated!</Text>
          
          <Text style={styles.description}>
            Get notified when you unlock achievements and reach money-saving milestones. 
            We'll celebrate your progress with you!
          </Text>

          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <Text style={styles.benefitEmoji}>🏆</Text>
              <Text style={styles.benefitText}>Achievement unlocks</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitEmoji}>💰</Text>
              <Text style={styles.benefitText}>Money saved milestones</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitEmoji}>🎯</Text>
              <Text style={styles.benefitText}>Progress celebrations</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.allowButton} 
              onPress={handleRequestPermissions}
            >
              <Bell size={16} color="#FFFFFF" />
              <Text style={styles.allowButtonText}>Enable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            You can change this in Settings at any time
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(53, 153, 141, 0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefits: {
    marginBottom: 24,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitEmoji: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  benefitText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  buttons: {
    marginBottom: 12,
  },
  allowButton: {
    backgroundColor: '#35998d',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
}); 