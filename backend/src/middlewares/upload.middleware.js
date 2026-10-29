import multer from 'multer';
import { TEMP_DIR } from '../config/paths.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, TEMP_DIR),
    filename: (req, file, cb) => {
        // Nombre temporal aleatorio; el controlador lo mueve a su carpeta final.
        const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
        cb(null, nombre);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido. Solo se permiten archivos PDF.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB
        files: 1
    }
});
