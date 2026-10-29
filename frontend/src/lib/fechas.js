// Utilidades de fecha que trabajan con YYYY-MM-DD sin desfases por zona horaria.
// Las fechas se muestran siempre en formato peruano: dd/mm/aaaa.

export function hoyISO() {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function normalizarISO(valor) {
    if (!valor) return null;
    const texto = String(valor).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
}

export function formatearFecha(valor, vacio = '—') {
    const iso = normalizarISO(valor);
    if (!iso) return vacio;
    const [anio, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${anio}`;
}

export function formatearFechaHora(valor, vacio = '—') {
    if (!valor) return vacio;
    const texto = String(valor);
    const fecha = normalizarISO(texto);
    if (!fecha) return vacio;
    const hora = texto.slice(11, 16);
    return /^\d{2}:\d{2}$/.test(hora) ? `${formatearFecha(fecha)} ${hora}` : formatearFecha(fecha);
}

export function sumarDiasISO(valor, dias) {
    const iso = normalizarISO(valor);
    if (!iso) return null;
    const [anio, mes, dia] = iso.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
    return fecha.toISOString().slice(0, 10);
}

export function diferenciaDias(desde, hasta) {
    const a = normalizarISO(desde);
    const b = normalizarISO(hasta);
    if (!a || !b) return null;
    const [a1, m1, d1] = a.split('-').map(Number);
    const [a2, m2, d2] = b.split('-').map(Number);
    const inicio = Date.UTC(a1, m1 - 1, d1);
    const fin = Date.UTC(a2, m2 - 1, d2);
    return Math.round((fin - inicio) / 86400000);
}

// Texto humano para la próxima fecha de monitoreo.
export function estadoMonitoreo(proximo) {
    const dias = diferenciaDias(hoyISO(), proximo);
    if (dias === null) return { texto: 'Sin programar', tono: 'neutro' };
    if (dias < 0) return { texto: `Vencido hace ${Math.abs(dias)} día(s)`, tono: 'vencido' };
    if (dias === 0) return { texto: 'Vence hoy', tono: 'hoy' };
    if (dias <= 7) return { texto: `En ${dias} día(s)`, tono: 'proximo' };
    return { texto: `En ${dias} día(s)`, tono: 'ok' };
}
