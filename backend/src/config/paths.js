import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backend/
export const BACKEND_DIR = path.resolve(__dirname, '../..');

// backend/uploads
export const UPLOADS_DIR = path.join(BACKEND_DIR, 'uploads');

// backend/uploads/_tmp (archivos temporales de Multer)
export const TEMP_DIR = path.join(UPLOADS_DIR, '_tmp');

fs.mkdirSync(TEMP_DIR, { recursive: true });

export function rutaPublica(archivoAbsoluto) {
    return '/' + path.relative(BACKEND_DIR, archivoAbsoluto).split(path.sep).join('/');
}
