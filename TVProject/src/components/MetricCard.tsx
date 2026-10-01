import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'emerald' | 'blue' | 'amber' | 'rose';
  hint?: string;
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  tone,
  hint,
  onPress
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getToneDetails = () => {
    switch (tone) {
      case 'emerald':
        return {
          color: '#10B981',
          bgIcon: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)'
        };
      case 'blue':
        return {
          color: '#3B82F6',
          bgIcon: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.3)'
        };
      case 'amber':
        return {
          color: '#F59E0B',
          bgIcon: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)'
        };
      case 'rose':
        return {
          color: '#EF4444',
          bgIcon: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)'
        };
    }
  };

  const toneConfig = getToneDetails();

  return (
    <Pressable
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPress={onPress}
      style={[
        styles.card,
        isFocused && styles.cardFocused
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.iconContainer, { backgroundColor: toneConfig.bgIcon }]}>
          <Ionicons name={icon} size={22} color={toneConfig.color} />
        </View>
      </View>

      <Text style={[styles.value, { color: toneConfig.color }]}>{value}</Text>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 200,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardFocused: {
    borderColor: theme.colors.focusBorder,
    borderWidth: 2,
    backgroundColor: theme.colors.bgCardHover,
    shadowColor: theme.colors.focusBorder,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    transform: [{ scale: 1.02 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textFaint,
    marginTop: 4,
  },
});
