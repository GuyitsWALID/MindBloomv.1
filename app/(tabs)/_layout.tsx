import { Tabs, Redirect } from 'expo-router';
import { Chrome as Home, Flower, ChartBar as BarChart3, User, Crown } from 'lucide-react-native';
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
        tabBarItemStyle: styles.tabItem,
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
        name="premium"
        options={{
          title: 'Premium',
          tabBarIcon: ({ size, color }) => (
            <Crown size={size} color={color} />
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
      {/* Keep journal as a hidden route for navigation but not in tabs */}
      <Tabs.Screen
        name="journal"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    height: Platform.OS === 'ios' ? 92 : 68,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  darkTabBar: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  tabLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 4,
  },
});