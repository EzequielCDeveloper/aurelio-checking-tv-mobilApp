import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, Text, View } from 'react-native';

import { PageHeading, Screen } from '@/components/Screen';
import { Card, EmptyState, FilledButton, IconTile, StatusPill } from '@/components/ui';
import { useAttendance } from '@/context/AttendanceProvider';
import { filterByPeriod, formatTime12, groupByDay, type PeriodFilter } from '@/lib/date';
import { exportAttendanceReport } from '@/lib/report';
import { computeStats, formatDuration } from '@/lib/stats';
import { colors } from '@/theme/tokens';

const PERIODS: { key: PeriodFilter; label: string }[] = [
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Este mes' },
  { key: 'anteriores', label: 'Anteriores' },
];

export default function HistorialScreen() {
  const { profile, records, isLoading } = useAttendance();
  const [period, setPeriod] = useState<PeriodFilter>('semana');
  const [exporting, setExporting] = useState(false);

  /**
   * El prototipo ignoraba el filtro: el boton de periodo cambiaba el estado
   * pero la lista y las metricas seguian mostrando todo. Acá el corte se
   * aplica una vez, sobre los registros, y de ahi salen la lista, las
   * estadisticas y el PDF.
   */
  const filtered = useMemo(() => filterByPeriod(records, period), [records, period]);
  const sections = useMemo(() => groupByDay(filtered), [filtered]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const handleExport = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      await exportAttendanceReport(filtered, profile);
    } catch (error) {
      console.error('Fallo la exportacion del reporte', error);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand[500]} size="large" />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionList
        sections={sections.map((s) => ({ ...s, data: s.records }))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <PageHeading
              eyebrow="Actividad"
              title="Historial"
              detail={`${records.length} marcajes registrados y firmados digitalmente`}
            />

            <View className="rounded-2xl bg-primary-soft p-1.5 shadow-card">
              <View className="flex-row gap-1">
                {PERIODS.map((option) => {
                  const active = option.key === period;
                  return (
                    <Pressable
                      key={option.key}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setPeriod(option.key)}
                      className={`min-h-11 flex-1 items-center justify-center rounded-xl px-2 ${
                        active ? 'bg-primary' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className="text-center text-[10px] font-semibold"
                        style={{ color: active ? '#ffffff' : colors.slate[500] }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text className="mb-3 mt-6 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
              Resumen del período
            </Text>
            <View className="flex-row gap-2.5">
              <Metric label="Puntualidad" value={`${stats.punctualityPercent}%`} />
              <Metric label="Retardos" value={String(stats.lateCount)} tone={stats.lateCount > 0 ? 'danger' : 'success'} />
              <Metric label="Días" value={String(stats.totalDays)} />
            </View>
            <View className="mt-2.5 flex-row gap-2.5">
              <Metric label="Horas registradas" value={formatDuration(stats.workedMinutes)} />
              <Metric label="Descanso" value={formatDuration(stats.breakMinutes)} />
            </View>

            <View className="mt-4">
              <FilledButton
                label="Exportar reporte PDF"
                icon="download"
                onPress={handleExport}
                loading={exporting}
                disabled={filtered.length === 0}
              />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View className="mb-2.5 mt-6 flex-row items-center justify-between px-1">
            <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {section.relativeLabel}
            </Text>
            <Text className="text-[10px] text-ink-faint">{section.longDate}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Card className="mb-2">
            <View className="flex-row items-center">
              <IconTile
                name={item.type === 'entrada' ? 'schedule' : 'logout'}
                tone={item.status === 'Retardo' ? 'danger' : 'success'}
              />
              <View className="ml-3 flex-1">
                <Text className="text-[12px] font-bold text-ink">{item.title}</Text>
                <Text className="text-[10px] text-ink-soft">{item.subtitle}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[12px] font-bold text-ink">
                  {formatTime12(item.timestamp).slice(0, 5)}
                </Text>
                <StatusPill status={item.status} />
              </View>
            </View>

            <View className="mt-3 flex-row items-center border-t border-line pt-3">
              <Ionicons name="location-outline" size={12} color={colors.slate[500]} />
              <Text className="ml-1 flex-1 text-[10px] text-ink-soft">{item.location}</Text>
              <Text className="font-mono text-[9px] text-primary">
                {item.hash.slice(0, 10)}
              </Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View className="mt-5">
            <EmptyState
              icon="calendar_month"
              title="Sin marcajes en este período"
              detail="Probá otro filtro para consultar actividad anterior."
            />
          </View>
        }
      />
    </Screen>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger';
}) {
  const tones = {
    default: 'bg-primary-soft border-brand-100',
    success: 'bg-success-soft border-success/20',
    danger: 'bg-danger-soft border-danger/20',
  } as const;
  return (
    <View className={`flex-1 rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <Text className="text-[9px] font-semibold uppercase tracking-wide text-ink-soft">{label}</Text>
      <Text className="mt-0.5 text-[15px] font-bold text-ink">{value}</Text>
    </View>
  );
}
