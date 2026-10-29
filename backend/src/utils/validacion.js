export function texto(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

export function requerido(valor) {
    return texto(valor).length > 0;
}

export function correoValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(valor));
}

export function enteroPositivo(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0;
}

export function aBooleano(valor) {
    return valor === true || valor === 1 || valor === '1' || valor === 'true';
}
