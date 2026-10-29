import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

// Origen del backend (sin /api) para armar enlaces a los PDFs y al export.
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

export const api = axios.create({
    baseURL: API_URL
});

export function urlArchivo(ruta) {
    if (!ruta) return null;
    return ruta.startsWith('http') ? ruta : `${API_ORIGIN}${ruta}`;
}

export const URL_EXPORT = `${API_URL}/movilidades/export`;
