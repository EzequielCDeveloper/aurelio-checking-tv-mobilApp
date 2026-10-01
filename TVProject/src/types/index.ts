export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  foto_url?: string | null;
  horario_id: number;
  nombre_turno?: string;
  hora_entrada?: string;
  estatus: 'Activo' | 'Baja' | string;
}

export interface Horario {
  id: number;
  nombre_turno: string;
  hora_entrada: string;
  tolerancia_minutos: number;
}

export interface Asistencia {
  id: number;
  nombre: string;
  apellido: string;
  foto_url?: string | null;
  tipo: 'Entrada' | 'Salida' | string;
  fecha_hora: string;
  estado: 'A tiempo' | 'Retardo' | string;
}

export interface InvitacionOnboarding {
  id: string;
  email: string;
  token: string;
  fecha: string;
  estado: 'Enviado' | 'Registrado';
}

export type TabType = 'dashboard' | 'empleados' | 'onboarding' | 'tv-board';
