const ZONA_HORARIA = 'America/Lima';

// Devuelve la fecha de hoy en Perú como YYYY-MM-DD
export function hoyISO() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_HORARIA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
}

export function fechaValida(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
    }

    const [anio, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));

    return fecha.getUTCFullYear() === anio
        && fecha.getUTCMonth() === mes - 1
        && fecha.getUTCDate() === dia;
}

// Suma días a una fecha YYYY-MM-DD sin problemas de zona horaria
export function sumarDias(fechaISO, dias) {
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
    return fecha.toISOString().slice(0, 10);
}

// Diferencia en días entre dos fechas YYYY-MM-DD
export function diferenciaDias(desdeISO, hastaISO) {
    const [a1, m1, d1] = desdeISO.split('-').map(Number);
    const [a2, m2, d2] = hastaISO.split('-').map(Number);
    const desde = Date.UTC(a1, m1 - 1, d1);
    const hasta = Date.UTC(a2, m2 - 1, d2);
    return Math.round((hasta - desde) / 86400000);
}
