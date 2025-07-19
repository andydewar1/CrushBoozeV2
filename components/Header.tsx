import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.pageHeader}>
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.pageSubtitle}>{subtitle}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
      >
        <Settings size={20} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 30,
  },
  titleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});