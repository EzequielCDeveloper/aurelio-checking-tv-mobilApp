import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { theme } from '../styles/theme';

export const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { refreshData, isLoading } = useApp();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightSection}>
        {/* Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>En línea</Text>
        </View>

        {/* Live Clock Pill */}
        <View style={styles.clockPill}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>{dateStr} • </Text>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>

        {/* Refresh Button */}
        <Pressable
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPress={refreshData}
          style={[styles.refreshBtn, isFocused && styles.btnFocused]}
        >
          <Ionicons
            name="reload"
            size={18}
            color={isLoading ? theme.colors.primary : theme.colors.text}
          />
        </Pressable>

        {/* Admin Avatar */}
        <View style={styles.adminChip}>
          <View style={styles.adminAvatar}>
            <Text style={styles.adminAvatarText}>HR</Text>
          </View>
          <View style={styles.adminMeta}>
            <Text style={styles.adminName}>Recursos Humanos</Text>
            <Text style={styles.adminRole}>Administrador</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 70,
    backgroundColor: theme.colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  timeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnFocused: {
    borderColor: theme.colors.focusBorder,
    borderWidth: 2,
  },
  adminChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: 4,
  },
  adminAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  adminAvatarText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  adminMeta: {
    justifyContent: 'center',
  },
  adminName: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  adminRole: {
    color: theme.colors.textFaint,
    fontSize: 10,
  },
});
