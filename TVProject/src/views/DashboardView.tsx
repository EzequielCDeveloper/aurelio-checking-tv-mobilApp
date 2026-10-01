import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { theme } from '../styles/theme';

export const DashboardView: React.FC = () => {
  const { kpis, attendance, employees, setActiveTab } = useApp();

  const formatTime = (isoString?: string) => {
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
      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        <MetricCard
          label="Empleados Activos"
          value={kpis.activeCount}
          icon="people"
          tone="emerald"
          hint="Total de personal en plantilla activa"
          onPress={() => setActiveTab('empleados')}
        />
        <MetricCard
          label="Check-in Hoy"
          value={kpis.checkInTodayCount}
          icon="log-in"
          tone="blue"
          hint="Entradas registradas durante la jornada"
        />
        <MetricCard
          label="A Tiempo"
          value={kpis.onTimeCount}
          icon="checkmark-circle"
          tone="emerald"
          hint="Llegadas dentro de la tolerancia de turno"
        />
        <MetricCard
          label="Retardos / Faltas"
          value={kpis.lateOrAbsentCount}
          icon="alert-circle"
          tone="rose"
          hint="Registros con retraso o ausencias del día"
        />
      </View>

      {/* Main Grid: Live Movements Table + Side Panel */}
      <View style={styles.gridSection}>
        {/* Movements Table Card */}
        <View style={styles.tableCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardTitle}>Últimos Movimientos</Text>
              <Text style={styles.cardSubtitle}>(Tiempo Real)</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>En vivo</Text>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeadRow}>
            <Text style={[styles.th, { flex: 2.5 }]}>Empleado</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Tipo</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Hora</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Dispositivo</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Estado</Text>
          </View>

          {/* Table Body */}
          {attendance.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={32} color={theme.colors.textFaint} />
              <Text style={styles.emptyTitle}>Sin registros aún</Text>
              <Text style={styles.emptyDesc}>No hay asistencias registradas en la jornada de hoy.</Text>
            </View>
          ) : (
            attendance.slice(0, 8).map((record) => {
              const fullName = `${record.nombre} ${record.apellido}`;
              const empMatch = employees.find(
                (e) => `${e.nombre} ${e.apellido}`.toLowerCase() === fullName.toLowerCase()
              );
              const turno = empMatch?.nombre_turno || 'General';
              const isRetardo = record.estado?.toLowerCase().includes('retardo') || record.estado?.toLowerCase().includes('retraso');

              return (
                <View key={record.id} style={styles.tableRow}>
                  {/* Empleado */}
                  <View style={[styles.td, { flex: 2.5, flexDirection: 'row', alignItems: 'center' }]}>
                    <Avatar name={fullName} url={record.foto_url} size={34} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.empName}>{fullName}</Text>
                      <Text style={styles.empMeta}>Turno {turno}</Text>
                    </View>
                  </View>

                  {/* Tipo */}
                  <View style={[styles.td, { flex: 1.5 }]}>
                    <Badge
                      label={record.tipo?.toUpperCase() || 'ENTRADA'}
                      variant={record.tipo?.toLowerCase() === 'salida' ? 'warning' : 'info'}
                    />
                  </View>

                  {/* Hora */}
                  <View style={[styles.td, { flex: 1.5 }]}>
                    <Text style={styles.timeVal}>{formatTime(record.fecha_hora)}</Text>
                  </View>

                  {/* Dispositivo */}
                  <View style={[styles.td, { flex: 1.5, flexDirection: 'row', alignItems: 'center' }]}>
                    <Ionicons name="finger-print-outline" size={15} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={styles.deviceText}>Lector Biométrico</Text>
                  </View>

                  {/* Estado */}
                  <View style={[styles.td, { flex: 1.5 }]}>
                    <Badge
                      label={isRetardo ? 'Retardo' : 'A tiempo'}
                      variant={isRetardo ? 'danger' : 'success'}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.xl,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  gridSection: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  tableCard: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  tableHeadRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  td: {
    justifyContent: 'center',
  },
  empName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  empMeta: {
    color: theme.colors.textFaint,
    fontSize: 11,
  },
  timeVal: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  deviceText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
