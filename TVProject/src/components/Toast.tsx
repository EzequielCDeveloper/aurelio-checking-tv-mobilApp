import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { theme } from '../styles/theme';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  const getIconName = () => {
    switch (toast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return theme.colors.primary;
      case 'error':
        return theme.colors.danger;
      default:
        return theme.colors.blue;
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getBorderColor() }]}>
      <Ionicons
        name={getIconName()}
        size={22}
        color={getBorderColor()}
        style={styles.icon}
      />
      <Text style={styles.message}>{toast.message}</Text>
      <Pressable onPress={dismissToast} style={styles.closeBtn}>
        <Ionicons name="close" size={18} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: 400,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  closeBtn: {
    marginLeft: 12,
    padding: 4,
  },
});
