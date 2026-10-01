import { Empleado, Horario, Asistencia } from '../types';

const BASE_URL = 'https://huella.cleyvadev.com';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMessage = errorJson.error;
    } catch {
      // Fallback to generic message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // 1. Empleados
  async getEmpleados(): Promise<Empleado[]> {
    return request<Empleado[]>('/api/empleados');
  },

  async createEmpleado(data: {
    nombre: string;
    apellido: string;
    foto_url?: string;
    horario_id: number;
    estatus?: string;
  }): Promise<{ mensaje: string; id: number }> {
    return request<{ mensaje: string; id: number }>('/api/empleados', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateEmpleado(id: number, data: Partial<Empleado>): Promise<{ mensaje: string }> {
    return request<{ mensaje: string }>(`/api/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // 2. Horarios
  async getHorarios(): Promise<Horario[]> {
    return request<Horario[]>('/api/horarios');
  },

  // 3. Asistencias
  async getAsistenciasSemana(): Promise<Asistencia[]> {
    return request<Asistencia[]>('/api/asistencias/semana');
  },

  async marcarAsistencia(data: {
    empleado_id: number;
    tipo: 'Entrada' | 'Salida';
  }): Promise<{ mensaje: string; empleado: string; tipo: string; estado: string; id_registro: number }> {
    return request<{
      mensaje: string;
      empleado: string;
      tipo: string;
      estado: string;
      id_registro: number;
    }>('/api/asistencias/marcar', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
