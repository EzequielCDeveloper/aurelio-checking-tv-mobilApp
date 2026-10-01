import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Empleado, Horario, Asistencia, InvitacionOnboarding, TabType } from '../types';
import { api } from '../services/api';

interface AppContextType {
  employees: Empleado[];
  schedules: Horario[];
  attendance: Asistencia[];
  invitations: InvitacionOnboarding[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isLoading: boolean;
  error: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;
  refreshData: () => Promise<void>;
  updateEmployeeSchedule: (employeeId: number, scheduleId: number) => Promise<void>;
  toggleEmployeeStatus: (employeeId: number, currentStatus: string) => Promise<void>;
  deleteEmployee: (employeeId: number) => Promise<void>;
  createInvitation: (email: string) => Promise<InvitacionOnboarding>;
  createNewEmployee: (data: { nombre: string; apellido: string; foto_url?: string; horario_id: number }) => Promise<void>;
  kpis: {
    activeCount: number;
    checkInTodayCount: number;
    onTimeCount: number;
    lateOrAbsentCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [schedules, setSchedules] = useState<Horario[]>([]);
  const [attendance, setAttendance] = useState<Asistencia[]>([]);
  const [invitations, setInvitations] = useState<InvitacionOnboarding[]>([
    {
      id: 'inv-1',
      email: 'm.gonzalez@empresa.com',
      token: 'onb-8f3a9e1b',
      fecha: new Date(Date.now() - 3600000 * 24).toISOString(),
      estado: 'Enviado'
    },
    {
      id: 'inv-2',
      email: 's.rodriguez@empresa.com',
      token: 'onb-7c2d1a4e',
      fecha: new Date(Date.now() - 3600000 * 48).toISOString(),
      estado: 'Registrado'
    }
  ]);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emps, scheds, atts] = await Promise.all([
        api.getEmpleados(),
        api.getHorarios(),
        api.getAsistenciasSemana()
      ]);
      setEmployees(emps || []);
      setSchedules(scheds || []);
      setAttendance(atts || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error al conectar con el backend');
      showToast('Error de conexión con el backend', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // KPIs
  const kpis = useMemo(() => {
    const activeCount = employees.filter((e) => e.estatus === 'Activo').length;
    
    // Check-in today: filter attendance from today
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecords = attendance.filter((a) => a.fecha_hora?.slice(0, 10) === todayStr);
    
    const checkInTodayCount = todayRecords.filter((a) => a.tipo?.toLowerCase() === 'entrada').length;
    const onTimeCount = todayRecords.filter((a) => a.estado === 'A tiempo').length;
    const lateOrAbsentCount = todayRecords.filter(
      (a) => a.estado === 'Retardo' || a.estado === 'retraso' || a.estado === 'Falta'
    ).length;

    return {
      activeCount,
      checkInTodayCount,
      onTimeCount,
      lateOrAbsentCount
    };
  }, [employees, attendance]);

  // Actions
  const updateEmployeeSchedule = useCallback(
    async (employeeId: number, scheduleId: number) => {
      try {
        await api.updateEmpleado(employeeId, { horario_id: scheduleId });
        showToast('Horario actualizado con éxito', 'success');
        await refreshData();
      } catch (err: any) {
        showToast(err.message || 'Error al actualizar horario', 'error');
        throw err;
      }
    },
    [showToast, refreshData]
  );

  const toggleEmployeeStatus = useCallback(
    async (employeeId: number, currentStatus: string) => {
      const newStatus = currentStatus === 'Activo' ? 'Baja' : 'Activo';
      try {
        await api.updateEmpleado(employeeId, { estatus: newStatus });
        showToast(
          newStatus === 'Baja' ? 'Empleado dado de baja con éxito' : 'Empleado reactivado con éxito',
          'success'
        );
        await refreshData();
      } catch (err: any) {
        showToast(err.message || 'Error al cambiar estatus', 'error');
        throw err;
      }
    },
    [showToast, refreshData]
  );

  const deleteEmployee = useCallback(
    async (employeeId: number) => {
      try {
        // En el backend actual, las bajas se gestionan marcando estatus = 'Baja'
        await api.updateEmpleado(employeeId, { estatus: 'Baja' });
        showToast('Empleado eliminado del directorio activo', 'success');
        await refreshData();
      } catch (err: any) {
        showToast(err.message || 'Error al eliminar empleado', 'error');
        throw err;
      }
    },
    [showToast, refreshData]
  );

  const createInvitation = useCallback(
    async (email: string): Promise<InvitacionOnboarding> => {
      const token = `onb-${Math.random().toString(36).substring(2, 10)}`;
      const newInv: InvitacionOnboarding = {
        id: `inv-${Date.now()}`,
        email: email.trim().toLowerCase(),
        token,
        fecha: new Date().toISOString(),
        estado: 'Enviado'
      };
      setInvitations((prev) => [newInv, ...prev]);
      showToast(`Invitación enviada a ${email}`, 'success');
      return newInv;
    },
    [showToast]
  );

  const createNewEmployee = useCallback(
    async (data: { nombre: string; apellido: string; foto_url?: string; horario_id: number }) => {
      try {
        await api.createEmpleado({
          ...data,
          estatus: 'Activo'
        });
        showToast(`Empleado ${data.nombre} creado con éxito`, 'success');
        await refreshData();
      } catch (err: any) {
        showToast(err.message || 'Error al crear empleado', 'error');
        throw err;
      }
    },
    [showToast, refreshData]
  );

  const value = {
    employees,
    schedules,
    attendance,
    invitations,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    toast,
    showToast,
    dismissToast,
    refreshData,
    updateEmployeeSchedule,
    toggleEmployeeStatus,
    deleteEmployee,
    createInvitation,
    createNewEmployee,
    kpis
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
