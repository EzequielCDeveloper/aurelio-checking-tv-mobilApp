const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  connectionLimit: 5
});

async function probarConexion() {
  try {
    const conn = await pool.getConnection();
    console.log('¡Conectado exitosamente a MariaDB!');
    conn.release(); // Liberar la conexión de vuelta al pool
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
}

probarConexion();

module.exports = pool;