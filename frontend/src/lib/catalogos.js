export const ESTADOS_MOVILIDAD = [
    'Postulando',
    'Aceptado',
    'En Extranjero',
    'Retornado',
    'Cerrado',
    'Cancelado'
];

export const ESTADOS_MONITOREO = ['Sin novedades', 'Requiere atención', 'Emergencia'];

export const SEMESTRES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export function etiquetaSemestre(valor) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1 || numero > 10) {
        return valor || '—';
    }
    return `${numero}.º semestre`;
}

export const MEDIOS_CONTACTO = ['WhatsApp', 'Llamada', 'Correo electrónico', 'Videollamada', 'Presencial'];

const CLASES_ESTADO = {
    Postulando: 'border-sky-200 bg-sky-50 text-sky-700',
    Aceptado: 'border-violet-200 bg-violet-50 text-violet-700',
    'En Extranjero': 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Retornado: 'border-slate-200 bg-slate-100 text-slate-700',
    Cerrado: 'border-slate-300 bg-slate-200 text-slate-700',
    Cancelado: 'border-rose-200 bg-rose-50 text-rose-700'
};

const CLASES_MONITOREO = {
    'Sin novedades': 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'Requiere atención': 'border-amber-200 bg-amber-50 text-amber-700',
    Emergencia: 'border-rose-200 bg-rose-50 text-rose-700'
};

export function claseEstadoMovilidad(estado) {
    return CLASES_ESTADO[estado] || 'border-border bg-muted text-muted-foreground';
}

export function claseEstadoMonitoreo(estado) {
    return CLASES_MONITOREO[estado] || 'border-border bg-muted text-muted-foreground';
}

// Se usa en los filtros de lista: "todos" no es un estado real.
export const FILTRO_TODOS = 'todos';
