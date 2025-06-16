import { Tabs, Redirect } from 'expo-router';
import { Chrome as Home, Flower, ChartBar as BarChart3, User, Crown } from 'lucide-react-native';
import { StyleSheet, Platform, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MentalHealthFooter } from '@/components/MentalHealthFooter';

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
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide the default tab bar
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
      
      {/* Single Unified Mental Health Footer */}
      <MentalHealthFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});