import { Tabs, Redirect } from 'expo-router';
import { Chrome as Home, BookOpen, Flower, ChartBar as BarChart3, User } from 'lucide-react-native';
import { StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { session, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          isDark && styles.darkTabBar
        ],
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Garden',
          tabBarIcon: ({ size, color }) => (
            <Flower size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    height: Platform.OS === 'ios' ? 88 : 64,
  },
  darkTabBar: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 4,
  },
});