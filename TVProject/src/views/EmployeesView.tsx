import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { EditScheduleModal } from '../components/EditScheduleModal';
import { NewEmployeeModal } from '../components/NewEmployeeModal';
import { Empleado } from '../types';
import { theme } from '../styles/theme';

export const EmployeesView: React.FC = () => {
  const { employees, toggleEmployeeStatus, deleteEmployee, isLoading } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activo' | 'Baja'>('Todos');
  const [editingEmployee, setEditingEmployee] = useState<Empleado | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Status filter
      if (statusFilter !== 'Todos' && emp.estatus !== statusFilter) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const fullName = `${emp.nombre} ${emp.apellido}`.toLowerCase();
        if (!fullName.includes(q)) return false;
      }

      return true;
    });
  }, [employees, statusFilter, search]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          {/* Search Input */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o apellidos..."
              placeholderTextColor={theme.colors.textFaint}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {/* Status Segmented Filter */}
          <View style={styles.filterPills}>
            {(['Todos', 'Activo', 'Baja'] as const).map((filter) => {
              const isSelected = statusFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillActive
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* New Employee Action Button */}
        <Pressable
          onPress={() => setIsNewModalOpen(true)}
          style={styles.newEmpBtn}
        >
          <Ionicons name="person-add" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.newEmpBtnText}>Nuevo Empleado</Text>
        </Pressable>
      </View>

      {/* Employees DataGrid / Table Card */}
      <View style={styles.tableCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Directorio de Empleados</Text>
          <Text style={styles.countText}>{filteredEmployees.length} registros encontrados</Text>
        </View>

        {/* DataGrid Header */}
        <View style={styles.gridHead}>
          <Text style={[styles.th, { width: 70 }]}>Foto</Text>
          <Text style={[styles.th, { flex: 2 }]}>Nombre</Text>
          <Text style={[styles.th, { flex: 2 }]}>Apellidos</Text>
          <Text style={[styles.th, { flex: 2 }]}>Horario</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Estatus</Text>
          <Text style={[styles.th, { width: 240, textAlign: 'center' }]}>Acciones</Text>
        </View>

        {/* Rows */}
        {filteredEmployees.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={40} color={theme.colors.textFaint} />
            <Text style={styles.emptyTitle}>No se encontraron empleados</Text>
            <Text style={styles.emptyDesc}>
              {search ? `Sin coincidencias para "${search}"` : 'No hay empleados con el filtro seleccionado.'}
            </Text>
          </View>
        ) : (
          filteredEmployees.map((emp) => {
            const isActivo = emp.estatus === 'Activo';

            return (
              <View key={emp.id} style={styles.gridRow}>
                {/* 1. Foto (miniatura) */}
                <View style={[styles.td, { width: 70 }]}>
                  <Avatar name={`${emp.nombre} ${emp.apellido}`} url={emp.foto_url} size={36} />
                </View>

                {/* 2. Nombre */}
                <View style={[styles.td, { flex: 2 }]}>
                  <Text style={styles.nameText}>{emp.nombre}</Text>
                  <Text style={styles.idText}>ID: #{emp.id}</Text>
                </View>

                {/* 3. Apellidos */}
                <View style={[styles.td, { flex: 2 }]}>
                  <Text style={styles.lastNameText}>{emp.apellido}</Text>
                </View>

                {/* 4. Horario */}
                <View style={[styles.td, { flex: 2 }]}>
                  <Text style={styles.schedText}>{emp.nombre_turno || 'General'}</Text>
                  <Text style={styles.schedSub}>{emp.hora_entrada ? `Entrada: ${emp.hora_entrada}` : 'Turno base'}</Text>
                </View>

                {/* 5. Estatus */}
                <View style={[styles.td, { flex: 1.5 }]}>
                  <Badge
                    label={emp.estatus || 'Activo'}
                    variant={isActivo ? 'success' : 'danger'}
                  />
                </View>

                {/* 6. Acciones: Botones en cada fila */}
                <View style={[styles.td, styles.actionsCol, { width: 240 }]}>
                  {/* Editar horario */}
                  <Pressable
                    onPress={() => setEditingEmployee(emp)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="time-outline" size={14} color={theme.colors.blue} style={{ marginRight: 4 }} />
                    <Text style={[styles.actionBtnText, { color: theme.colors.blue }]}>Horario</Text>
                  </Pressable>

                  {/* Dar de baja / Reactivar */}
                  <Pressable
                    onPress={() => toggleEmployeeStatus(emp.id, emp.estatus)}
                    style={[
                      styles.actionBtn,
                      isActivo ? styles.bajaBtn : styles.reactivarBtn
                    ]}
                  >
                    <Ionicons
                      name={isActivo ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                      size={14}
                      color={isActivo ? theme.colors.warning : theme.colors.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        { color: isActivo ? theme.colors.warning : theme.colors.primary }
                      ]}
                    >
                      {isActivo ? 'Dar de baja' : 'Reactivar'}
                    </Text>
                  </Pressable>

                  {/* Eliminar */}
                  <Pressable
                    onPress={() => deleteEmployee(emp.id)}
                    style={[styles.actionBtn, styles.deleteBtn]}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Modals */}
      <EditScheduleModal
        visible={Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
      />

      <NewEmployeeModal
        visible={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    flexWrap: 'wrap',
    gap: 12,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    flexWrap: 'wrap',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 42,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
  },
  filterPills: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 3,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  filterPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  newEmpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newEmpBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  countText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  gridHead: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  td: {
    justifyContent: 'center',
  },
  nameText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  idText: {
    color: theme.colors.textFaint,
    fontSize: 11,
  },
  lastNameText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  schedText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  schedSub: {
    color: theme.colors.textFaint,
    fontSize: 11,
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bajaBtn: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  reactivarBtn: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  deleteBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
