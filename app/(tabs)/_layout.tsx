import { Tabs } from 'expo-router';
import { House, ChartBar as BarChart3, Zap, Trophy, Target } from 'lucide-react-native';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#35998d',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: 'rgba(53, 153, 141, 0.1)',
          paddingBottom: 20,
          paddingTop: 12,
          height: 90,
          elevation: 16,
          shadowColor: '#000000',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: -8 },
          shadowRadius: 24,
          position: 'absolute',
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <House size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ size, color }) => (
            <Zap size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievem...',
          tabBarIcon: ({ size, color }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ size, color }) => (
            <Target size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}