import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '-05:00',
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

try{
    const connection = await pool.getConnection();
    console.log('Conexion BD : OK');
    connection.release();
} catch (error){
    console.error('Error : ', error.message);
}

export default pool;