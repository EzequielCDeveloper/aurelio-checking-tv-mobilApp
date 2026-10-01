import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { theme } from '../styles/theme';

export const TVBoardView: React.FC = () => {
  const { attendance, kpis, refreshData } = useApp();
  const [clock, setClock] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDate(
        now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatClockTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* TV Hero Banner */}
      <View style={styles.tvHero}>
        <View style={styles.heroLeft}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TERMINAL TV EN VIVO</Text>
          </View>
          <Text style={styles.clockLarge}>{clock}</Text>
          <Text style={styles.dateLarge}>{date.toUpperCase()}</Text>
        </View>

        <View style={styles.heroRight}>
          <View style={styles.tvKpiCard}>
            <Text style={styles.tvKpiLabel}>PRESENTES HOY</Text>
            <Text style={[styles.tvKpiVal, { color: '#10B981' }]}>{kpis.checkInTodayCount}</Text>
          </View>
          <View style={styles.tvKpiCard}>
            <Text style={styles.tvKpiLabel}>A TIEMPO</Text>
            <Text style={[styles.tvKpiVal, { color: '#3B82F6' }]}>{kpis.onTimeCount}</Text>
          </View>
          <View style={styles.tvKpiCard}>
            <Text style={styles.tvKpiLabel}>RETARDOS</Text>
            <Text style={[styles.tvKpiVal, { color: '#EF4444' }]}>{kpis.lateOrAbsentCount}</Text>
          </View>
        </View>
      </View>

      {/* Attendance TV Feed Section */}
      <View style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="scan-outline" size={24} color={theme.colors.primary} style={{ marginRight: 10 }} />
            <Text style={styles.feedTitle}>Marcaciones de Asistencia Recientes</Text>
          </View>
          <Text style={styles.feedSubtitle}>Historial de la última semana (Optimizado para TV)</Text>
        </View>

        {/* 2-Column TV Cards Grid */}
        <View style={styles.tvGrid}>
          {attendance.slice(0, 10).map((record) => {
            const fullName = `${record.nombre} ${record.apellido}`;
            const isRetardo =
              record.estado?.toLowerCase().includes('retardo') ||
              record.estado?.toLowerCase().includes('retraso');
            const isSalida = record.tipo?.toLowerCase() === 'salida';

            return (
              <View key={record.id} style={styles.tvItemCard}>
                <Avatar name={fullName} url={record.foto_url} size={50} />

                <View style={styles.tvItemCenter}>
                  <Text style={styles.tvEmpName}>{fullName}</Text>
                  <View style={styles.tvItemSub}>
                    <Badge
                      label={record.tipo?.toUpperCase() || 'ENTRADA'}
                      variant={isSalida ? 'warning' : 'info'}
                    />
                    <Text style={styles.tvDeviceText}>• Lector Biométrico</Text>
                  </View>
                </View>

                <View style={styles.tvItemRight}>
                  <Text style={styles.tvTime}>{formatClockTime(record.fecha_hora)}</Text>
                  <Badge
                    label={isRetardo ? 'Retardo' : 'A tiempo'}
                    variant={isRetardo ? 'danger' : 'success'}
                    size="md"
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  content: {
    padding: theme.spacing.xl,
  },
  tvHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
    flexWrap: 'wrap',
    gap: 16,
  },
  heroLeft: {
    flex: 1,
    minWidth: 260,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  clockLarge: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  dateLarge: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  heroRight: {
    flexDirection: 'row',
    gap: 12,
  },
  tvKpiCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minWidth: 120,
  },
  tvKpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textFaint,
    letterSpacing: 0.8,
  },
  tvKpiVal: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  feedCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  feedSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  tvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  tvItemCard: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    margin: 8,
  },
  tvItemCenter: {
    flex: 1,
    marginLeft: 14,
  },
  tvEmpName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  tvItemSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tvDeviceText: {
    color: theme.colors.textFaint,
    fontSize: 12,
  },
  tvItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tvTime: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
