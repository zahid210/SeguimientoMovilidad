import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

const schema = await fs.readFile(schemaPath, 'utf8');

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
});

try {
    const [tablas] = await connection.query('SHOW TABLES');
    let filasTotales = 0;

    for (const tabla of tablas) {
        const nombre = Object.values(tabla)[0];
        const [[conteo]] = await connection.query(`SELECT COUNT(*) AS n FROM \`${nombre}\``);
        filasTotales += Number(conteo.n);
    }

    if (filasTotales > 0 && !process.argv.includes('--force')) {
        console.error(
            `La base de datos tiene ${filasTotales} fila(s). ` +
            'Para recrear las tablas y perder esos datos ejecuta: npm run db:init -- --force'
        );
        process.exitCode = 1;
    } else {
        console.log('Recreando esquema...');
        await connection.query(schema);
        console.log('Esquema creado correctamente.');
        console.log('Tablas: estudiantes, movilidades, tipos_documento, documentos, monitoreos.');
        console.log('Tipos de documento cargados: 14.');
    }
} catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exitCode = 1;
} finally {
    await connection.end();
}
