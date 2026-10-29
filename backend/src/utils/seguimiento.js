import { hoyISO, sumarDias, diferenciaDias } from './fechas.js';

const ESTADOS_FINALIZADOS = ['Retornado', 'Cerrado', 'Cancelado'];
const DIAS_QUINCENA = 15;

/**
 * Calcula el próximo monitoreo y si está vencido.
 * Regla: un monitoreo cada 15 días.
 * - Si hay monitoreos: el próximo es el último + 15 días.
 * - Si no hay: el primero vence a los 15 días de la salida.
 * - Si la movilidad está finalizada, no se generan alertas.
 */
export function calcularSeguimiento(movilidad, ultimoMonitoreo, totalMonitoreos = 0) {
    const hoy = hoyISO();
    const finalizada = ESTADOS_FINALIZADOS.includes(movilidad.estado);
    const base = ultimoMonitoreo || movilidad.fecha_salida;

    if (!base || finalizada) {
        return {
            ultimo_monitoreo: ultimoMonitoreo,
            proximo_monitoreo: null,
            monitoreo_vencido: false,
            dias_para_monitoreo: null,
            monitoreos_realizados: totalMonitoreos
        };
    }

    const proximo = sumarDias(base, DIAS_QUINCENA);
    const dias = diferenciaDias(hoy, proximo);

    return {
        ultimo_monitoreo: ultimoMonitoreo,
        proximo_monitoreo: proximo,
        monitoreo_vencido: dias < 0,
        dias_para_monitoreo: dias,
        monitoreos_realizados: totalMonitoreos
    };
}

export { DIAS_QUINCENA };
