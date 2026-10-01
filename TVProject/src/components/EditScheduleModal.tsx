import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Empleado } from '../types';
import { theme } from '../styles/theme';

interface EditScheduleModalProps {
  visible: boolean;
  employee: Empleado | null;
  onClose: () => void;
}

export const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  visible,
  employee,
  onClose,
}) => {
  const { schedules, updateEmployeeSchedule } = useApp();
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (employee) {
      setSelectedScheduleId(employee.horario_id);
    }
  }, [employee]);

  if (!employee) return null;

  const handleSave = async () => {
    if (!selectedScheduleId) return;
    setIsSubmitting(true);
    try {
      await updateEmployeeSchedule(employee.id, selectedScheduleId);
      onClose();
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Editar Horario de Empleado</Text>
              <Text style={styles.subtitle}>
                {employee.nombre} {employee.apellido}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Schedule Options */}
          <Text style={styles.fieldLabel}>Selecciona el nuevo turno asignado:</Text>
          <View style={styles.schedulesList}>
            {schedules.map((sched) => {
              const isSelected = selectedScheduleId === sched.id;
              return (
                <Pressable
                  key={sched.id}
                  onPress={() => setSelectedScheduleId(sched.id)}
                  style={[
                    styles.schedItem,
                    isSelected && styles.schedItemSelected
                  ]}
                >
                  <View style={styles.schedItemLeft}>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? theme.colors.primary : theme.colors.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <View>
                      <Text style={[styles.schedName, isSelected && styles.schedTextActive]}>
                        Turno {sched.nombre_turno}
                      </Text>
                      <Text style={styles.schedTime}>
                        Entrada: {sched.hora_entrada} (Tolerancia: {sched.tolerancia_minutos} min)
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable onPress={handleSave} style={styles.saveBtn} disabled={isSubmitting}>
              <Ionicons name="checkmark" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveText}>
                {isSubmitting ? 'Guardando...' : 'Guardar Horario'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  schedulesList: {
    marginBottom: theme.spacing.xl,
  },
  schedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
    marginBottom: 8,
  },
  schedItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  schedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schedName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  schedTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  schedTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  cancelText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
