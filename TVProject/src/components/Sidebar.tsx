import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { theme } from '../styles/theme';

interface NavItem {
  id: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard (Inicio)', icon: 'grid-outline' },
  { id: 'empleados', label: 'Gestión de Empleados', icon: 'people-outline' },
  { id: 'onboarding', label: 'Invitaciones (Onboarding)', icon: 'mail-outline' },
  { id: 'tv-board', label: 'Tablero TV / Kiosco', icon: 'tv-outline' },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brandContainer}>
        <View style={styles.brandIcon}>
          <Ionicons name="time" size={24} color="#10B981" />
        </View>
        <Text style={styles.brandName}>
          Asistencia<Text style={styles.brandAccent}>Pro</Text>
        </Text>
      </View>

      {/* Nav Section */}
      <View style={styles.navSection}>
        <Text style={styles.navLabel}>PANEL DE CONTROL</Text>

        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const isFocused = focusedId === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setActiveTab(item.id)}
              onFocus={() => setFocusedId(item.id)}
              onBlur={() => setFocusedId(null)}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isFocused && styles.navItemFocused
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={isActive ? '#10B981' : isFocused ? '#38BDF8' : theme.colors.textMuted}
                style={styles.navIcon}
              />
              <Text
                style={[
                  styles.navText,
                  isActive && styles.navTextActive,
                  isFocused && styles.navTextFocused
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={styles.activePill} />}
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerVersion}>Versión 2.5.0</Text>
        <View style={styles.platformBadge}>
          <Ionicons name="hardware-chip-outline" size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.platformText}>tvOS & Web Ready</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#0B132B',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xxl,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#10B981',
  },
  navSection: {
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textFaint,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  navItemFocused: {
    borderColor: theme.colors.focusBorder,
    borderWidth: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    shadowColor: theme.colors.focusBorder,
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  navIcon: {
    marginRight: 12,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    flex: 1,
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navTextFocused: {
    color: '#FFFFFF',
  },
  activePill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  footerVersion: {
    fontSize: 12,
    color: theme.colors.textFaint,
    fontWeight: '500',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  platformText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
