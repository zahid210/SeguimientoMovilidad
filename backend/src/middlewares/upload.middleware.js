import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { dni, anio } = req.body;

        const folderAnio = anio || new Date().getFullYear();
        const folderDNI = dni || 'sin_dni';
        const uploadPath = `uploads/${folderAnio}/${folderDNI}`;

        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true});
        }
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const { tipo_documento } = req.body;
        const extension = path.extname(file.originalname);
        const nombreBase = tipo_documento ? tipo_documento : 'documento';

        cb(null, `${nombreBase}-${Date.now()}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido. Solo se permiten archivos PDF.'));
    }
};

export const upload = multer({ storage, fileFilter });