const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// 1. GESTIÓN DE EMPLEADOS
// ==========================================

// Obtener todos los empleados (con su turno asignado)
app.get('/api/empleados', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT e.*, h.nombre_turno, h.hora_entrada 
      FROM empleados e 
      JOIN horarios h ON e.horario_id = h.id
    `;
    const filas = await conn.query(query);
    res.json(filas);
  } catch (err) {
    console.error('Error al obtener empleados:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Registrar un nuevo empleado
app.post('/api/empleados', async (req, res) => {
  const { nombre, apellido, foto_url, horario_id, estatus } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const resultado = await conn.query(
      'INSERT INTO empleados (nombre, apellido, foto_url, horario_id, estatus) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, foto_url, horario_id, estatus || 'Activo']
    );
    res.status(201).json({ 
      mensaje: 'Empleado creado con éxito', 
      id: Number(resultado.insertId) 
    });
  } catch (err) {
    console.error('Error al crear empleado:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Modificar un empleado existente (Datos o Estatus de Baja/Activo)
app.put('/api/empleados/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, foto_url, horario_id, estatus } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const resultado = await conn.query(
      `UPDATE empleados 
       SET nombre = COALESCE(?, nombre), 
           apellido = COALESCE(?, apellido), 
           foto_url = COALESCE(?, foto_url), 
           horario_id = COALESCE(?, horario_id), 
           estatus = COALESCE(?, estatus) 
       WHERE id = ?`,
      [nombre, apellido, foto_url, horario_id, estatus, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({ mensaje: 'Empleado actualizado con éxito' });
  } catch (err) {
    console.error('Error al actualizar empleado:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ==========================================
// 2. GESTIÓN DE HORARIOS (Para selects en el Frontend)
// ==========================================
app.get('/api/horarios', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const filas = await conn.query('SELECT * FROM horarios');
    res.json(filas);
  } catch (err) {
    console.error('Error al obtener horarios:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// ==========================================
// 3. ASISTENCIAS (Entradas, Salidas y Retardos)
// ==========================================

// Marcar Entrada o Salida (Con cálculo automático de retardo)
app.post('/api/asistencias/marcar', async (req, res) => {
  const { empleado_id, tipo } = req.body; // tipo: 'Entrada' o 'Salida'
  let conn;
  
  if (!['Entrada', 'Salida'].includes(tipo)) {
    return res.status(400).json({ error: "El tipo debe ser 'Entrada' o 'Salida'" });
  }

  try {
    conn = await pool.getConnection();

    // 1. Verificar que el empleado exista y esté activo
    const empleadoQuery = await conn.query(
      'SELECT e.*, h.hora_entrada, h.tolerancia_minutos FROM empleados e JOIN horarios h ON e.horario_id = h.id WHERE e.id = ? AND e.estatus = "Activo"',
      [empleado_id]
    );

    if (empleadoQuery.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado o dado de baja' });
    }

    const empleado = empleadoQuery[0];
    let estado = null;

    // 2. Si es una ENTRADA, calcular si llegó a tiempo o con retardo
    if (tipo === 'Entrada') {
      const ahora = new Date();
      const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();

      // Convertir la hora de entrada del turno a minutos totales del día
      const [horasTurno, minutosTurno] = empleado.hora_entrada.split(':').map(Number);
      const horaTurnoMinutos = horasTurno * 60 + minutosTurno;

      // Sumar la tolerancia permitida
      const limitePermitido = horaTurnoMinutos + empleado.tolerancia_minutos;

      if (horaActualMinutos <= limitePermitido) {
        estado = 'A tiempo';
      } else {
        estado = 'Retardo';
      }
    } else {
      // Para salidas el estado puede quedar por defecto sin evaluar
      estado = 'A tiempo'; 
    }

    // 3. Guardar el registro en la base de datos con la hora del servidor (NOW())
    const resultado = await conn.query(
      'INSERT INTO asistencias (empleado_id, tipo, fecha_hora, estado) VALUES (?, ?, NOW(), ?)',
      [empleado_id, tipo, estado]
    );

    res.status(201).json({ 
      mensaje: `Registro de ${tipo} guardado con éxito`,
      empleado: `${empleado.nombre} ${empleado.apellido}`,
      tipo,
      estado,
      id_registro: Number(resultado.insertId)
    });

  } catch (err) {
    console.error('Error al marcar asistencia:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Obtener el historial de la última semana (Optimizado para la tabla de la TV)
app.get('/api/asistencias/semana', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT a.id, e.nombre, e.apellido, e.foto_url, a.tipo, a.fecha_hora, a.estado 
      FROM asistencias a 
      JOIN empleados e ON a.empleado_id = e.id 
      WHERE a.fecha_hora >= NOW() - INTERVAL 7 DAY 
      ORDER BY a.fecha_hora DESC
    `;
    const filas = await conn.query(query);
    res.json(filas);
  } catch (err) {
    console.error('Error al obtener asistencias de la semana:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});