import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, CreditCard as Edit3, Save, X, LogOut, Settings, Bell, Shield, CircleHelp as HelpCircle, Moon, Sun } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface NotificationSettings {
  dailyReminders: boolean;
  weeklyReports: boolean;
  achievementAlerts: boolean;
  moodCheckIns: boolean;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    dailyReminders: true,
    weeklyReports: true,
    achievementAlerts: true,
    moodCheckIns: true,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      loadNotificationSettings();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
      setFullName(data.full_name || '');
    }
  };

  const loadNotificationSettings = () => {
    // In a real app, this would load from user preferences
    // For now, we'll use default values
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      setProfile({ ...profile, full_name: fullName });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    }
    setLoading(false);
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // In a real app, this would save to the backend
  };

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
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            } else {
              router.replace('/(auth)/sign-in');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { 
      icon: Bell, 
      title: 'Notifications', 
      subtitle: 'Manage your notifications',
      onPress: () => setShowSettings(!showSettings)
    },
    { 
      icon: Shield, 
      title: 'Privacy & Security', 
      subtitle: 'Control your privacy settings',
      onPress: () => Alert.alert('Privacy & Security', 'Privacy settings coming soon!')
    },
    { 
      icon: Settings, 
      title: 'App Settings', 
      subtitle: 'Customize your experience',
      onPress: () => Alert.alert('App Settings', 'Additional settings coming soon!')
    },
    { 
      icon: HelpCircle, 
      title: 'Help & Support', 
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Help & Support', 'Support: help@mindbloom.app')
    },
  ];

  const stats = [
    { label: 'Days Active', value: '15' },
    { label: 'Journal Entries', value: '47' },
    { label: 'Plants Grown', value: '4' },
    { label: 'Streak', value: '12' },
  ];

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient 
        colors={isDark ? ['#1F2937', '#111827'] : ['#F3E8FF', '#FFFFFF']} 
        style={styles.gradient}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 210 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, isDark && styles.darkText]}>Your Profile 👤</Text>
              <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>Manage your wellness journey</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              {isDark ? <Sun size={24} color="#F59E0B" /> : <Moon size={24} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={[styles.profileCard, isDark && styles.darkCard]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, isDark && styles.darkAvatar]}>
                <User size={40} color="#8B5CF6" />
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Edit3 size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.nameInput, isDark && styles.darkInput]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={[styles.cancelButton, isDark && styles.darkCancelButton]}
                      onPress={() => {
                        setIsEditing(false);
                        setFullName(profile.full_name || '');
                      }}
                    >
                      <X size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.saveButton, loading && styles.disabledButton]}
                      onPress={updateProfile}
                      disabled={loading}
                    >
                      <Save size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.displayContainer}>
                  <Text style={[styles.userName, isDark && styles.darkText]}>
                    {profile.full_name || 'Anonymous User'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Edit3 size={16} color="#8B5CF6" />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.emailContainer}>
                <Mail size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text style={[styles.userEmail, isDark && styles.darkSubtitle]}>{profile.email}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsCard, isDark && styles.darkCard]}>
            <Text style={[styles.statsTitle, isDark && styles.darkText]}>Your Journey</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Settings</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={[styles.menuItem, isDark && styles.darkCard]} onPress={item.onPress}>
                <View style={[styles.menuIcon, isDark && styles.darkMenuIcon]}>
                  <item.icon size={20} color="#8B5CF6" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, isDark && styles.darkText]}>{item.title}</Text>
                  <Text style={[styles.menuSubtitle, isDark && styles.darkSubtitle]}>{item.subtitle}</Text>
                </View>
                <View style={styles.menuArrow}>
                  <Text style={[styles.arrowText, isDark && styles.darkSubtitle]}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notification Settings */}
          {showSettings && (
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Notification Settings</Text>
              <View style={[styles.settingsCard, isDark && styles.darkCard]}>
                {Object.entries(notifications).map(([key, value]) => (
                  <View key={key} style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, isDark && styles.darkText]}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Text>
                      <Text style={[styles.settingSubtitle, isDark && styles.darkSubtitle]}>
                        {key === 'dailyReminders' && 'Daily wellness check-ins'}
                        {key === 'weeklyReports' && 'Weekly progress summaries'}
                        {key === 'achievementAlerts' && 'Milestone celebrations'}
                        {key === 'moodCheckIns' && 'Gentle mood reminders'}
                      </Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={(newValue) => updateNotificationSetting(key as keyof NotificationSettings, newValue)}
                      trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                      thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Sign Out */}
          <TouchableOpacity style={[styles.signOutButton, isDark && styles.darkSignOutButton]} onPress={handleSignOut}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={[styles.appInfoText, isDark && styles.darkSubtitle]}>Mindbloom v1.0.0</Text>
            <Text style={[styles.appInfoText, isDark && styles.darkSubtitle]}>Made with 💚 for your wellness</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E8FF',
  },
  darkContainer: {
    backgroundColor: '#1F2937',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkAvatar: {
    backgroundColor: '#4B5563',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    width: '100%',
    alignItems: 'center',
  },
  editContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    marginBottom: 16,
    minWidth: 200,
  },
  darkInput: {
    color: '#F9FAFB',
    borderBottomColor: '#4B5563',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCancelButton: {
    backgroundColor: '#4B5563',
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  menuSection: {
    margin: 24,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  darkMenuIcon: {
    backgroundColor: '#4B5563',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  menuArrow: {
    padding: 4,
  },
  arrowText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 24,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkSignOutButton: {
    backgroundColor: '#374151',
    borderColor: '#7F1D1D',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 0,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
});