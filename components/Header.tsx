import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Settings } from 'lucide-react-native';

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Image 
          source={require('../assets/images/CrushNic Logo (1).png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 40,
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