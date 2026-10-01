import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { theme } from '../styles/theme';

interface NewEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({ visible, onClose }) => {
  const { schedules, createNewEmployee } = useApp();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [horarioId, setHorarioId] = useState<number>(schedules[0]?.id || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (schedules.length > 0 && !horarioId) {
      setHorarioId(schedules[0].id);
    }
  }, [schedules, horarioId]);

  const handleSubmit = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      setErrorMsg('El nombre y los apellidos son obligatorios');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await createNewEmployee({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        foto_url: fotoUrl.trim() || undefined,
        horario_id: horarioId
      });
      setNombre('');
      setApellido('');
      setFotoUrl('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear empleado');
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
              <Text style={styles.title}>Registrar Nuevo Empleado</Text>
              <Text style={styles.subtitle}>Alta en el sistema y asignación de turno</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.formBody}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.danger} style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Carlos"
                placeholderTextColor={theme.colors.textFaint}
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            {/* Apellido */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Apellidos *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Mendoza"
                placeholderTextColor={theme.colors.textFaint}
                value={apellido}
                onChangeText={setApellido}
              />
            </View>

            {/* Foto URL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>URL de Foto (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://ejemplo.com/foto.jpg"
                placeholderTextColor={theme.colors.textFaint}
                value={fotoUrl}
                onChangeText={setFotoUrl}
              />
            </View>

            {/* Horario */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Turno Asignado *</Text>
              <View style={styles.schedulesRow}>
                {schedules.map((sched) => {
                  const isSelected = horarioId === sched.id;
                  return (
                    <Pressable
                      key={sched.id}
                      onPress={() => setHorarioId(sched.id)}
                      style={[
                        styles.schedChip,
                        isSelected && styles.schedChipSelected
                      ]}
                    >
                      <Text style={[styles.schedChipText, isSelected && styles.schedChipTextActive]}>
                        {sched.nombre_turno} ({sched.hora_entrada})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable onPress={handleSubmit} style={styles.submitBtn} disabled={isSubmitting}>
              <Ionicons name="person-add" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitText}>
                {isSubmitting ? 'Registrando...' : 'Registrar Empleado'}
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
    maxWidth: 520,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    maxHeight: '90%',
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
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  formBody: {
    marginBottom: theme.spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.radius.md,
    padding: 10,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: theme.colors.text,
    fontSize: 14,
  },
  schedulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  schedChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  schedChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  schedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  schedChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
