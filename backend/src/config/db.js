import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { asegurarBaseDeDatos } from '../models/index.js';

dotenv.config();

// Asegurar que la base de datos exista antes de conectar el pool
try {
    await asegurarBaseDeDatos();
} catch (error) {
    console.error('Aviso al verificar/crear base de datos:', error.message);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'uncp_movilidad',
    port: Number(process.env.DB_PORT) || 3306,
    timezone: '-05:00',
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

try {
    const connection = await pool.getConnection();
    console.log('Conexión BD Pool: OK');
    connection.release();
} catch (error) {
    console.error('Error al conectar BD Pool:', error.message);
}

export default pool;
