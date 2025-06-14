import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video as LucideIcon } from 'lucide-react-native';

interface WellnessCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  isDark?: boolean;
}

export function WellnessCard({ icon: Icon, title, subtitle, color, onPress, isDark = false }: WellnessCardProps) {
  return (
    <TouchableOpacity style={[styles.card, isDark && styles.darkCard]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.title, isDark && styles.darkTitle]}>{title}</Text>
      <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  darkTitle: {
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
});