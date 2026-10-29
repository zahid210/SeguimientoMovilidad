import axios from 'axios';

// Creamos una instancia preconfigurada apuntando a nuestro backend
export const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});